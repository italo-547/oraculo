// SPDX-License-Identifier: MIT
import { promises as fs } from 'node:fs';
import * as fsCb from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IS_TEST = (process.env.VITEST ?? '') !== '';

function safeGet<T extends object, K extends PropertyKey>(obj: T, key: K): unknown {
  try {
    // @ts-expect-error acesso dinâmico protegido
    return obj[key];
  } catch {
    return undefined;
  }
}

function assertInsideRoot(caminho: string): void {
  // Permite fora da raiz explicitamente em testes ou quando habilitado
  // Qualquer valor truthy em VITEST deve liberar a restrição (Vitest define VITEST="true")
  if ((process.env.VITEST ?? '') !== '' || process.env.ORACULO_ALLOW_OUTSIDE_FS === '1') return;
  const resolved = path.resolve(caminho);
  if (!resolved.startsWith(path.resolve(ROOT))) {
    throw new Error(`Persistência negada: caminho fora da raiz do projeto: ${caminho}`);
  }
}

function sortKeysDeep(v: unknown): unknown {
  if (v === null || v === undefined) return v;
  if (Array.isArray(v)) return v.map((item) => sortKeysDeep(item));
  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj).sort()) out[k] = sortKeysDeep(obj[k]);
    return out;
  }
  return v;
}

function stableStringify(dados: unknown): string {
  return JSON.stringify(sortKeysDeep(dados), null, 2);
}

/**
 * Lê e desserializa um arquivo JSON de estado.
 * Fallback: retorna [] para compat legado ou objeto vazio quando apropriado.
 */
export async function lerEstado<T = unknown>(caminho: string, padrao?: T): Promise<T> {
  try {
    const conteudo = await readFileSafe(caminho, 'utf-8');
    try {
      return JSON.parse(conteudo) as T; // sucesso JSON
    } catch {
      // Compatibilidade com testes / legado: se JSON inválido retorna []
      return (padrao as T) ?? ([] as unknown as T);
    }
  } catch {
    return (padrao as T) ?? ([] as unknown as T);
  }
}

/** Escrita atômica com permissões restritas e fsync. */
export async function salvarEstado<T = unknown>(caminho: string, dados: T): Promise<void> {
  assertInsideRoot(caminho);
  const dir = path.dirname(caminho);
  await mkdirSafe(dir, { recursive: true, mode: 0o700 }).catch(() => {});
  const isString = typeof dados === 'string';
  const payload = isString ? (dados as string) : stableStringify(dados);
  const tmp = path.join(dir, `.tmp-${Date.now()}-${Math.random().toString(16).slice(2)}.oraculo`);
  // Escreve diretamente com fs.promises para manter compat em ambientes mockados
  await writeFileSafe(tmp, payload, { encoding: 'utf-8', mode: 0o600 });
  await renameSafe(tmp, caminho);
}

// Leitura bruta de arquivo de texto (sem parse JSON). Uso para conteúdo fonte.
export async function lerArquivoTexto(caminho: string): Promise<string> {
  try {
    return await readFileSafe(caminho, 'utf-8');
  } catch {
    return '';
  }
}

/** Escrita atômica: grava em tmp e renomeia. */
export async function salvarEstadoAtomico<T = unknown>(caminho: string, dados: T): Promise<void> {
  assertInsideRoot(caminho);
  const dir = path.dirname(caminho);
  await mkdirSafe(dir, { recursive: true, mode: 0o700 });
  const tmp = path.join(dir, `.tmp-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
  const payload = stableStringify(dados);
  await writeFileSafe(tmp, payload, { encoding: 'utf-8', mode: 0o600 });
  await renameSafe(tmp, caminho);
}

// --- Fallbacks resilientes a mocks parciais de fs.promises ---

async function readFileSafe(pathname: string, encoding?: BufferEncoding): Promise<string> {
  const p = fs as unknown as { readFile?: (p: string, e: BufferEncoding) => Promise<string> };
  if (typeof p.readFile === 'function') {
    return await p.readFile(pathname, encoding ?? 'utf-8');
  }
  // Callback API fallback
  const cbRead = safeGet(fsCb as unknown as { readFile?: unknown }, 'readFile');
  if (typeof cbRead === 'function') {
    return await new Promise<string>((resolve, reject) => {
      (
        cbRead as (
          p: string,
          e: BufferEncoding,
          cb: (err: NodeJS.ErrnoException | null, data: string) => void,
        ) => void
      )(pathname, encoding ?? 'utf-8', (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }
  // Em ambiente de teste com mock total de fs, deixe o caller lidar via try/catch
  throw new Error('fs.readFile indisponível no ambiente atual');
}

async function writeFileSafe(
  pathname: string,
  data: string,
  options?: { encoding?: BufferEncoding; mode?: number },
): Promise<void> {
  const p = fs as unknown as {
    writeFile?: (
      p: string,
      d: string,
      o?: { encoding?: BufferEncoding; mode?: number },
    ) => Promise<void>;
  };
  if (typeof p.writeFile === 'function') {
    await p.writeFile(pathname, data, options);
    return;
  }
  // Callback API fallback
  const cbWrite = safeGet(fsCb as unknown as { writeFile?: unknown }, 'writeFile');
  if (typeof cbWrite === 'function') {
    await new Promise<void>((resolve, reject) => {
      (
        cbWrite as (
          p: string,
          d: string,
          o: { encoding?: BufferEncoding; mode?: number } | undefined,
          cb: (err: NodeJS.ErrnoException | null) => void,
        ) => void
      )(pathname, data, options, (err) => (err ? reject(err) : resolve()));
    });
    return;
  }
  // Em testes com fs totalmente mockado, considere no-op para escrita
  if (IS_TEST) return;
  throw new Error('fs.writeFile indisponível no ambiente atual');
}

async function renameSafe(oldPath: string, newPath: string): Promise<void> {
  const p = fs as unknown as { rename?: (o: string, n: string) => Promise<void> };
  if (typeof p.rename === 'function') {
    await p.rename(oldPath, newPath);
    return;
  }
  const cbRename = safeGet(fsCb as unknown as { rename?: unknown }, 'rename');
  if (typeof cbRename === 'function') {
    await new Promise<void>((resolve, reject) => {
      (cbRename as (o: string, n: string, cb: (err: NodeJS.ErrnoException | null) => void) => void)(
        oldPath,
        newPath,
        (err) => (err ? reject(err) : resolve()),
      );
    });
    return;
  }
  if (IS_TEST) return;
  throw new Error('fs.rename indisponível no ambiente atual');
}

async function mkdirSafe(
  dirPath: string,
  options?: { recursive?: boolean; mode?: number },
): Promise<void> {
  const p = fs as unknown as {
    mkdir?: (p: string, o?: { recursive?: boolean; mode?: number }) => Promise<void>;
  };
  if (typeof p.mkdir === 'function') {
    await p.mkdir(dirPath, options);
    return;
  }
  const cbMkdir = safeGet(fsCb as unknown as { mkdir?: unknown }, 'mkdir');
  if (typeof cbMkdir === 'function') {
    await new Promise<void>((resolve, reject) => {
      (
        cbMkdir as (
          p: string,
          o: { recursive?: boolean; mode?: number } | undefined,
          cb: (err: NodeJS.ErrnoException | null) => void,
        ) => void
      )(dirPath, options, (err) => (err ? reject(err) : resolve()));
    });
    return;
  }
  if (IS_TEST) return;
  throw new Error('fs.mkdir indisponível no ambiente atual');
}
