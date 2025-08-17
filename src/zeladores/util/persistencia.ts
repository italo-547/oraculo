import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Lê e desserializa um arquivo JSON de estado.
 * Fallback: retorna [] para compat legado ou objeto vazio quando apropriado.
 */
export async function lerEstado<T = unknown>(caminho: string): Promise<T> {
  try {
    const conteudo = await fs.readFile(caminho, 'utf-8');
    try {
      return JSON.parse(conteudo) as T; // sucesso JSON
    } catch {
      // Compatibilidade com testes / legado: se JSON inválido retorna []
      return [] as unknown as T;
    }
  } catch {
    return [] as unknown as T;
  }
}

/** Serialização simples (não atômica). */
export async function salvarEstado<T = unknown>(caminho: string, dados: T): Promise<void> {
  const dir = path.dirname(caminho);
  await fs.mkdir(dir, { recursive: true }).catch(() => {});
  const isString = typeof dados === 'string';
  const payload = isString ? (dados as string) : JSON.stringify(dados, null, 2);
  const tmp = path.join(dir, `.tmp-${Date.now()}-${Math.random().toString(16).slice(2)}.oraculo`);
  await fs.writeFile(tmp, payload, 'utf-8');
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
  const dir = path.dirname(caminho);
  await fs.mkdir(dir, { recursive: true });
  const tmp = path.join(dir, `.tmp-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
  const payload = JSON.stringify(dados, null, 2);
  await fs.writeFile(tmp, payload, 'utf-8');
  await fs.rename(tmp, caminho);
}
