import type { TecnicaAplicarResultado, ContextoExecucao, SinaisProjeto } from '../tipos/tipos.js';
export declare const sinaisDetectados: SinaisProjeto;
/**
 * Analisa a estrutura do projeto e detecta padrões como monorepo, fullstack, mistura de src/packages, etc.
 * Retorna ocorrências para cada sinal relevante encontrado.
 */
export declare const detectorEstrutura: {
    nome: string;
    global: boolean;
    test(_relPath: string): boolean;
    aplicar(_src: string, _relPath: string, _ast: unknown, _fullPath?: string, contexto?: ContextoExecucao): TecnicaAplicarResultado;
};
//# sourceMappingURL=detector-estrutura.d.ts.map