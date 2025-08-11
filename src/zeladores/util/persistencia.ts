import { promises as fs } from 'node:fs';

export async function lerEstado<T = any>(caminho: string): Promise<T> {
    try {
        const conteudo = await fs.readFile(caminho, 'utf-8');
        return JSON.parse(conteudo);
    } catch {
        return [] as any;
    }
}

export async function salvarEstado<T = any>(caminho: string, dados: T): Promise<void> {
    await fs.writeFile(caminho, JSON.stringify(dados, null, 2), 'utf-8');
}
