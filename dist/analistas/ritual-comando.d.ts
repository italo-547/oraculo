export declare const ritualComando: {
    nome: string;
    test: (relPath: any) => any;
    aplicar(conteudo: any, arquivo: any, ast: any, fullPath: any, contexto: any): {
        tipo: string;
        nivel: string;
        relPath: any;
        linha: number;
        arquivo: any;
        mensagem: string;
        origem: string;
    }[] | {
        tipo: string;
        nivel: string;
        relPath: any;
        linha: number;
        arquivo: any;
        mensagem: string;
        resolucao: string;
        origem: string;
    }[];
};
//# sourceMappingURL=ritual-comando.d.ts.map