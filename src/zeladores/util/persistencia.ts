import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function lerEstado<T = unknown>(caminho: string): Promise<T> {
  try {
    const conteudo = await fs.readFile(caminho, 'utf-8');
    try {
      return JSON.parse(conteudo) as T; // tenta JSON
    } catch {
      // Retorna conteúdo bruto quando não é JSON válido
      return conteudo as unknown as T;
    }
  } catch {
    // Erro de leitura: mantém fallback anterior (array vazia) para compatibilidade
    return [] as unknown as T;
  }
}

export async function salvarEstado<T = unknown>(caminho: string, dados: T): Promise<void> {
  // Garante que o diretório existe antes de tentar escrever
  const dir = path.dirname(caminho);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    /* ignorado */
  }
  if (typeof dados === 'string') {
    await fs.writeFile(caminho, dados, 'utf-8');
  } else {
    await fs.writeFile(caminho, JSON.stringify(dados, null, 2), 'utf-8');
  }
}

// Leitura bruta de arquivo de texto (sem parse JSON). Uso para conteúdo fonte.
export async function lerArquivoTexto(caminho: string): Promise<string> {
  try {
    return await fs.readFile(caminho, 'utf-8');
  } catch {
    return '';
  }
}
