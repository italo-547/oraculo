import type { TecnicaAplicarResultado, ContextoExecucao } from '@tipos/tipos.js';
import type { NodePath } from '@babel/traverse';
export declare const grafoDependencias: Map<string, Set<string>>;
/**
 * Analisa dependências do arquivo (import/require), detecta padrões problemáticos e atualiza grafo global.
 * Retorna ocorrências para imports/require suspeitos, mistos, circulares, etc.
 */
export declare const detectorDependencias: {
  nome: string;
  test(relPath: string): boolean;
  aplicar(
    src: string,
    relPath: string,
    ast: NodePath | null,
    _fullPath?: string,
    contexto?: ContextoExecucao,
  ): TecnicaAplicarResultado;
};
//# sourceMappingURL=detector-dependencias.d.ts.map
