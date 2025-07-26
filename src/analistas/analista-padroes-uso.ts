// src/analistas/analista-padroes-uso.ts
import * as t from '@babel/types';
import { traverse } from '../nucleo/constelacao/traverse.js';
import type { Estatisticas, Ocorrencia, ContextoExecucao, TecnicaAplicarResultado } from '../tipos/tipos.js';

// Objeto para armazenar as estatísticas acumuladas
export const estatisticasUsoGlobal: Estatisticas = {
  requires: {},
  consts: {},
  exports: {}
};

// Função auxiliar para incrementar contadores
function incrementar(contador: Record<string, number>, chave: string): void {
  contador[chave] = (contador[chave] ?? 0) + 1;
}

export const analistaPadroesUso = {
  nome: 'analista-padroes-uso',
  global: true,
  test: (relPath: string): boolean => relPath.endsWith('.js') || relPath.endsWith('.ts'),
  aplicar: (
    _src: string,
    _relPath: string,
    _ast: unknown,
    _fullPath: string,
    contexto?: ContextoExecucao
  ): TecnicaAplicarResultado => {
    const ocorrencias: Ocorrencia[] = [];

    // Limpa as estatísticas no início da execução da técnica global
    estatisticasUsoGlobal.requires = {};
    estatisticasUsoGlobal.consts = {};
    estatisticasUsoGlobal.exports = {};

    if (!contexto) return null;

    for (const file of contexto.arquivos) {
      const ast = file.ast;
      if (!ast) continue;

      traverse(ast, {
        enter(path) {
          if (t.isVariableDeclaration(path.node) && path.node.kind === 'const') {
            incrementar(estatisticasUsoGlobal.consts, path.node.kind);
          }

          if (t.isCallExpression(path.node) && t.isIdentifier(path.node.callee)) {
            const nome = path.node.callee.name;
            if (nome === 'require') {
              incrementar(estatisticasUsoGlobal.requires, nome);
            }
          }

          if (t.isExportNamedDeclaration(path.node) || t.isExportDefaultDeclaration(path.node)) {
            incrementar(estatisticasUsoGlobal.exports, 'export');
          }
        }
      });
    }

    return ocorrencias;
  }
};