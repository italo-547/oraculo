import { traverse } from '../nucleo/constelacao/traverse.js';
import * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';
import type { ContextoExecucao, Ocorrencia, TecnicaAplicarResultado } from '../tipos/tipos.js';
import type { Node } from '@babel/types';

export function extractHandlerInfo(node: Node): { func: Node; bodyBlock: t.BlockStatement } | null {
  if (t.isFunctionDeclaration(node) && t.isBlockStatement(node.body)) {
    return { func: node, bodyBlock: node.body };
  }

  if (
    (t.isFunctionExpression(node) || t.isArrowFunctionExpression(node)) &&
    t.isBlockStatement(node.body)
  ) {
    return { func: node, bodyBlock: node.body };
  }

  return null;
}

export const ritualComando = {
  nome: 'ritual-comando',
  test: (relPath: string): boolean => relPath.includes('bot'),

  aplicar(
    conteudo: string,
    arquivo: string,
    ast: NodePath | null,
    fullPath?: string,
    _contexto?: ContextoExecucao,
  ): TecnicaAplicarResultado {
    const ocorrencias: Ocorrencia[] = [];
    const encontrados = new Set<string>();

    if (!ast) {
      return [
        {
          tipo: 'erro',
          nivel: 'erro',
          relPath: arquivo,
          linha: 1,
          arquivo,
          mensagem: 'AST não fornecida ou inválida para validação do comando.',
          origem: 'ritual-comando',
        },
      ];
    }

    traverse(ast.node, {
      enter(path) {
        const node = path.node;
        if (t.isCallExpression(node) && t.isIdentifier(node.callee)) {
          const nome = node.callee.name;
          if (['onCommand', 'registerCommand'].includes(nome)) {
            const arg = node.arguments[1];
            const info = extractHandlerInfo(arg as Node);
            if (info) {
              encontrados.add(nome);
            }
          }
        }
      },
    });

    if (encontrados.size === 0) {
      ocorrencias.push({
        tipo: 'padrao-ausente',
        nivel: 'aviso',
        mensagem: 'Nenhum comando registrado usando "onCommand" ou "registerCommand".',
        relPath: arquivo,
        origem: 'ritual-comando',
      });
    }

    return ocorrencias;
  },
};
