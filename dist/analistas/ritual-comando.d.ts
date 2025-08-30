import * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';
import type { ContextoExecucao, TecnicaAplicarResultado } from '../tipos/tipos.js';
import type { Node } from '@babel/types';
/**
 * Extrai informações do handler de comando, se for função válida.
 */
export interface HandlerInfo {
    func: Node;
    bodyBlock: t.BlockStatement;
    isAnonymous: boolean;
    params: t.Identifier[];
    totalParams: number;
}
export declare function extractHandlerInfo(node: unknown): HandlerInfo | null;
/**
 * Analisa comandos registrados (onCommand/registerCommand), detecta duplicidade, handlers inválidos, boas práticas.
 * Retorna ocorrências para cada problema ou padrão detectado.
 */
export declare const ritualComando: {
    nome: string;
    test: (relPath: string) => boolean;
    aplicar(conteudo: string, arquivo: string, ast: NodePath | null, _fullPath?: string, _contexto?: ContextoExecucao): TecnicaAplicarResultado;
};
//# sourceMappingURL=ritual-comando.d.ts.map