import type { NodePath } from '@babel/traverse';
import type { ContextoExecucao, TecnicaAplicarResultado } from '../tipos/tipos.js';
import type { Node } from '@babel/types';
export declare const ritualComando: {
    nome: string;
    test: (relPath: string) => boolean;
    aplicar(conteudo: string, arquivo: string, ast: NodePath<Node> | null, fullPath: string, contexto?: ContextoExecucao): TecnicaAplicarResultado;
};
//# sourceMappingURL=ritual-comando.d.ts.map