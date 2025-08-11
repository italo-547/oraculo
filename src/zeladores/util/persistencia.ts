import { promises as fs } from 'node:fs';

export async function lerEstado<T = unknown>(caminho: string): Promise<T> {
    try {
        const conteudo = await fs.readFile(caminho, 'utf-8');
        return JSON.parse(conteudo) as T;
    } catch {
        // Retorna valor padrão para tipos conhecidos
        return ([] as unknown) as T;
    }
}

export async function salvarEstado<T = unknown>(caminho: string, dados: T): Promise<void> {
    if (typeof dados === 'string') {
        await fs.writeFile(caminho, dados, 'utf-8');
    } else {
        await fs.writeFile(caminho, JSON.stringify(dados, null, 2), 'utf-8');
    }
}
