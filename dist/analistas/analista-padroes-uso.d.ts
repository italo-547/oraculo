import type { Estatisticas, ContextoExecucao, TecnicaAplicarResultado } from '@tipos/tipos.js';
export declare const estatisticasUsoGlobal: Estatisticas;
export declare const analistaPadroesUso: {
    nome: string;
    global: boolean;
    test: (relPath: string) => boolean;
    aplicar: (_src: string, relPath: string, astInput: unknown, _fullPath?: string, contexto?: ContextoExecucao) => TecnicaAplicarResultado;
};
//# sourceMappingURL=analista-padroes-uso.d.ts.map