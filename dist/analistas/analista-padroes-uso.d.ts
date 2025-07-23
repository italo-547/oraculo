export declare const estatisticasUsoGlobal: {
    requires: {};
    consts: {};
    exports: {};
};
export declare const analistaPadroesUso: {
    nome: string;
    global: boolean;
    test: (relPath: any) => any;
    aplicar: (_src: any, _relPath: any, _ast: any, _fullPath: any, contexto: any) => {
        tipo: string;
        codigo: string;
        severidade: number;
        nivel: string;
        relPath: string;
        arquivo: string;
        linha: number;
        mensagem: string;
        origem: string;
    }[] | {
        tipo: string;
        codigo: string;
        severidade: number;
        nivel: string;
        relPath: string;
        arquivo: string;
        linha: number;
        mensagem: string;
        origem: string;
        detalhes: {
            requires: {};
            consts: {};
            exports: {};
        };
    }[];
};
//# sourceMappingURL=analista-padroes-uso.d.ts.map