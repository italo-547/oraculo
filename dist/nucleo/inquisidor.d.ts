import { executarInquisicao } from './executor.js';
declare const tecnicas: {
    nome: string;
    aplicar(src: any, relPath: any, ast: any, fullPath: any, contexto: any): {
        tipo: string;
        mensagem: string;
        arquivo: any;
        origem: string;
        nivel: string;
        relPath: any;
        linha: number;
    }[];
}[];
declare function iniciarInquisicao(baseDir?: string, options?: {}): Promise<{
    totalArquivos: any;
    ocorrencias: any[];
    fileEntries: unknown[];
}>;
export { executarInquisicao, tecnicas, iniciarInquisicao };
//# sourceMappingURL=inquisidor.d.ts.map