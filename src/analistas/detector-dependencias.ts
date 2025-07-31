import path from 'node:path';
import { traverse } from '../nucleo/constelacao/traverse.js';

import type {
  TecnicaAplicarResultado,
  ContextoExecucao,
  Ocorrencia
} from '../tipos/tipos.js';
import type {
  Node,
  ImportDeclaration,
  CallExpression,
  StringLiteral
} from '@babel/types';
import type { NodePath } from '@babel/traverse';

export const grafoDependencias: Map<string, Set<string>> = new Map();

/**
 * Normaliza o caminho de import para uma chave consistente.
 */
function normalizarModulo(mod: string, relPath: string): string {
  if (mod.startsWith('.')) {
    const resolved = path
      .normalize(path.join(path.dirname(relPath), mod))
      .replace(/\\/g, '/');
    return resolved;
  }
  return mod;
}

/**
 * Extrai referências de import/require do AST.
 */
function extrairReferencias(ast: NodePath<Node>): string[] {
  const refs: string[] = [];

  traverse(ast, {
    ImportDeclaration(path: NodePath<ImportDeclaration>) {
      refs.push(path.node.source.value);
    },
    CallExpression(path: NodePath<CallExpression>) {
      const { callee, arguments: args } = path.node;
      if (
        callee.type === 'Identifier' &&
        callee.name === 'require' &&
        args[0]?.type === 'StringLiteral'
      ) {
        refs.push((args[0] as StringLiteral).value);
      }
    }
  });

  return refs;
}

export const detectorDependencias = {
  nome: 'detector-dependencias',
  test(relPath: string): boolean {
    return relPath.endsWith('.ts') || relPath.endsWith('.js');
  },

  aplicar(
    _src: string,
    relPath: string,
    ast: NodePath<Node> | null,
    _fullPath: string,
    _contexto?: ContextoExecucao
  ): TecnicaAplicarResultado {
    if (!ast) return [];

    const ocorrencias: Ocorrencia[] = [];
    const refs = extrairReferencias(ast);

    for (const ref of refs) {
      const dep = normalizarModulo(ref, relPath);
      let set = grafoDependencias.get(relPath);
      if (!set) {
        set = new Set<string>();
        grafoDependencias.set(relPath, set);
      }
      set.add(dep);
    }

    // (Opcional) Você pode gerar ocorrências aqui se quiser validar algo
    // como ciclos de dependência, requires relativos suspeitos etc.

    return ocorrencias;
  }
};