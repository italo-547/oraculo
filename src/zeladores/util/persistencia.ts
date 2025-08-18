// SPDX-License-Identifier: MIT
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

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
    const conteudo = await fs.readFile(caminho, 'utf-8');
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
  await fs.mkdir(dir, { recursive: true, mode: 0o700 }).catch(() => {});
  const isString = typeof dados === 'string';
  const payload = isString ? (dados as string) : stableStringify(dados);
  const tmp = path.join(dir, `.tmp-${Date.now()}-${Math.random().toString(16).slice(2)}.oraculo`);
  const fh = await (await import('node:fs')).promises.open(tmp, 'w', 0o600);
  try {
    await fh.writeFile(payload, 'utf-8');
    try {
      await fh.sync();
    } catch {}
  } finally {
    await fh.close().catch(() => {});
  }
  await fs.rename(tmp, caminho);
}

// Leitura bruta de arquivo de texto (sem parse JSON). Uso para conteúdo fonte.
export async function lerArquivoTexto(caminho: string): Promise<string> {
  try {
    return await fs.readFile(caminho, 'utf-8');
  } catch {
    return '';
  }
}

/** Escrita atômica: grava em tmp e renomeia. */
export async function salvarEstadoAtomico<T = unknown>(caminho: string, dados: T): Promise<void> {
  assertInsideRoot(caminho);
  const dir = path.dirname(caminho);
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  const tmp = path.join(dir, `.tmp-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
  const payload = stableStringify(dados);
  const fh = await (await import('node:fs')).promises.open(tmp, 'w', 0o600);
  try {
    await fh.writeFile(payload, 'utf-8');
    try {
      await fh.sync();
    } catch {}
  } finally {
    await fh.close().catch(() => {});
  }
  await fs.rename(tmp, caminho);
}
