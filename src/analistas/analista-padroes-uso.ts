// src/analistas/analista-padroes-uso.ts
import * as t from '@babel/types';
import { traverse } from '../nucleo/constelacao/traverse.js';
import type {
  Estatisticas,
  Ocorrencia,
  ContextoExecucao,
  TecnicaAplicarResultado,
} from '../tipos/tipos.js';


// Estatísticas globais (mantidas)
export const estatisticasUsoGlobal: Estatisticas = {
  requires: {},
  consts: {},
  exports: {},
  vars: {},
  lets: {},
  evals: {},
  withs: {},
};

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
    fullPath?: string,
    contexto?: ContextoExecucao,
  ): TecnicaAplicarResultado => {
    const ocorrencias: Ocorrencia[] = [];

    // Limpa estatísticas
    estatisticasUsoGlobal.requires = {};
    estatisticasUsoGlobal.consts = {};
    estatisticasUsoGlobal.exports = {};
    estatisticasUsoGlobal.vars = {};
    estatisticasUsoGlobal.lets = {};
    estatisticasUsoGlobal.evals = {};
    estatisticasUsoGlobal.withs = {};

    if (!contexto) return null;

    for (const file of contexto.arquivos) {
      const ast = file.ast;
      if (!ast) continue;
      const relPath = file.relPath;

      traverse('node' in ast ? ast.node : ast, {
        enter(path) {
          const node = path.node;
          // Detecta var
          if (t.isVariableDeclaration(node) && node.kind === 'var') {
            incrementar(estatisticasUsoGlobal.vars, relPath);
            ocorrencias.push({
              tipo: 'alerta',
              mensagem: `Uso de 'var' detectado. Prefira 'let' ou 'const'.`,
              arquivo: relPath,
              linha: node.loc?.start.line,
              coluna: node.loc?.start.column,
            });
          }
          // Detecta let
          if (t.isVariableDeclaration(node) && node.kind === 'let') {
            incrementar(estatisticasUsoGlobal.lets, relPath);
            ocorrencias.push({
              tipo: 'info',
              mensagem: `Uso de 'let'. Considere 'const' se não houver reatribuição.`,
              arquivo: relPath,
              linha: node.loc?.start.line,
              coluna: node.loc?.start.column,
            });
          }
          // Detecta const
          if (t.isVariableDeclaration(node) && node.kind === 'const') {
            incrementar(estatisticasUsoGlobal.consts, relPath);
          }
          // Detecta require
          if (t.isCallExpression(node) && t.isIdentifier(node.callee)) {
            const nome = node.callee.name;
            if (nome === 'require') {
              incrementar(estatisticasUsoGlobal.requires, relPath);
              // Alerta se for em arquivo TS
              if (relPath.endsWith('.ts')) {
                ocorrencias.push({
                  tipo: 'alerta',
                  mensagem: `Uso de 'require' em arquivo TypeScript. Prefira 'import'.`,
                  arquivo: relPath,
                  linha: node.loc?.start.line,
                  coluna: node.loc?.start.column,
                });
              }
            }
            if (nome === 'eval') {
              incrementar(estatisticasUsoGlobal.evals, relPath);
              ocorrencias.push({
                tipo: 'critico',
                mensagem: `Uso de 'eval' detectado. Evite por questões de segurança e performance.`,
                arquivo: relPath,
                linha: node.loc?.start.line,
                coluna: node.loc?.start.column,
              });
            }
          }
          // Detecta export
          if (t.isExportNamedDeclaration(node) || t.isExportDefaultDeclaration(node)) {
            incrementar(estatisticasUsoGlobal.exports, relPath);
          }
          // Detecta module.exports ou exports. em TS
          if (
            (t.isAssignmentExpression(node) &&
              t.isMemberExpression(node.left) &&
              ((t.isIdentifier(node.left.object) && node.left.object.name === 'module' && t.isIdentifier(node.left.property) && node.left.property.name === 'exports') ||
                (t.isIdentifier(node.left.object) && node.left.object.name === 'exports')) &&
              relPath.endsWith('.ts'))
          ) {
            ocorrencias.push({
              tipo: 'alerta',
              mensagem: `Uso de 'module.exports' ou 'exports' em arquivo TypeScript. Prefira 'export'.`,
              arquivo: relPath,
              linha: node.loc?.start.line,
              coluna: node.loc?.start.column,
            });
          }
          // Detecta with
          if (t.isWithStatement(node)) {
            incrementar(estatisticasUsoGlobal.withs, relPath);
            ocorrencias.push({
              tipo: 'critico',
              mensagem: `Uso de 'with' detectado. Evite por questões de legibilidade e escopo.`,
              arquivo: relPath,
              linha: node.loc?.start.line,
              coluna: node.loc?.start.column,
            });
          }
          // Detecta funções anônimas (exceto arrow)
          if (
            (t.isFunctionExpression(node) || t.isFunctionDeclaration(node)) &&
            !node.id &&
            !t.isArrowFunctionExpression(node)
          ) {
            ocorrencias.push({
              tipo: 'info',
              mensagem: `Função anônima detectada. Considere nomear funções para melhor rastreabilidade.`,
              arquivo: relPath,
              linha: node.loc?.start.line,
              coluna: node.loc?.start.column,
            });
          }
          // Detecta arrow function como método de classe
          if (
            t.isClassProperty?.(node) &&
            t.isArrowFunctionExpression(node.value)
          ) {
            ocorrencias.push({
              tipo: 'info',
              mensagem: `Arrow function usada como método de classe. Prefira métodos tradicionais para melhor herança.`,
              arquivo: relPath,
              linha: node.loc?.start.line,
              coluna: node.loc?.start.column,
            });
          }
        },
      });
    }

    return ocorrencias;
  },
};
