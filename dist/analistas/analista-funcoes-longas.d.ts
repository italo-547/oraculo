import type { TecnicaAplicarResultado, ContextoExecucao } from '../tipos/tipos.js';
import type { Node } from '@babel/types';
import type { NodePath } from '@babel/traverse';
export declare const analistaFuncoesLongas: {
    nome: string;
    test: (relPath: string) => boolean;
    global: boolean;
    aplicar(src: string, relPath: string, ast: NodePath<Node> | null, fullPath: string, contexto?: ContextoExecucao): TecnicaAplicarResultado;
};
//# sourceMappingURL=analista-funcoes-longas.d.ts.map