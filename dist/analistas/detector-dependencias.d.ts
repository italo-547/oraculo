import type { TecnicaAplicarResultado, ContextoExecucao } from '../tipos/tipos.js';
import type { Node } from '@babel/types';
import type { NodePath } from '@babel/traverse';
export declare const grafoDependencias: Map<string, Set<string>>;
export declare const detectorDependencias: {
    nome: string;
    test(relPath: string): boolean;
    aplicar(_src: string, relPath: string, ast: NodePath<Node> | null, _fullPath?: string, _contexto?: ContextoExecucao): TecnicaAplicarResultado;
};
//# sourceMappingURL=detector-dependencias.d.ts.map