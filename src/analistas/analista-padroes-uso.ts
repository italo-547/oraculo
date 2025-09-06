// SPDX-License-Identifier: MIT
// src/analistas/analista-padroes-uso.ts
import * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';
import { traverse } from '@nucleo/constelacao/traverse.js';
import { incrementar, garantirArray } from '@zeladores/util/helpers-analistas.js';
import type {
  Estatisticas,
  Ocorrencia,
  ContextoExecucao,
  TecnicaAplicarResultado,
} from '@tipos/tipos.js';
import { criarOcorrencia, ocorrenciaErroAnalista } from '@tipos/tipos.js';

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

export const analistaPadroesUso = {
  nome: 'analista-padroes-uso',
  global: false,
  test: (relPath: string): boolean => relPath.endsWith('.js') || relPath.endsWith('.ts'),
  aplicar: (
    _src: string,
    relPath: string,
    astInput: unknown,
    _fullPath?: string,
    contexto?: ContextoExecucao,
  ): TecnicaAplicarResultado => {
    // Per-file: não exige contexto; ele é usado apenas como fallback para localizar AST
    const ocorrencias: Ocorrencia[] = [];

    const push = (
      data: Omit<Ocorrencia, 'nivel' | 'origem' | 'tipo' | 'mensagem'> & {
        tipo: string;
        mensagem: string;
        nivel?: Ocorrencia['nivel'];
        origem?: string;
        arquivo?: string;
        relPath?: string;
      },
    ) => {
      ocorrencias.push(
        criarOcorrencia({
          nivel: data.nivel,
          origem: data.origem,
          tipo: data.tipo,
          mensagem: data.mensagem,
          relPath: data.arquivo || data.relPath,
          linha: data.linha,
          coluna: data.coluna,
        }),
      );
    };

    const statsFlag = estatisticasUsoGlobal as Estatisticas & { ___RESET_DONE___?: boolean };
    if (!statsFlag.___RESET_DONE___) {
      estatisticasUsoGlobal.requires = {};
      estatisticasUsoGlobal.consts = {};
      estatisticasUsoGlobal.exports = {};
      estatisticasUsoGlobal.vars = {};
      estatisticasUsoGlobal.lets = {};
      estatisticasUsoGlobal.evals = {};
      estatisticasUsoGlobal.withs = {};
      statsFlag.___RESET_DONE___ = true;
    }

    // Normaliza AST recebido do executor (pode ser { node } ou o nó direto); fallback ao contexto
    let astWrap = astInput as unknown as { node?: unknown; type?: string } | undefined;
    if (!astWrap && contexto?.arquivos) {
      const found = contexto.arquivos.find((f) => f.relPath === relPath) || contexto.arquivos[0];
      astWrap = (found?.ast as unknown as { node?: unknown; type?: string }) || undefined;
    }
    const ast = (astWrap && (astWrap as { node?: unknown }).node) || astWrap;
    if (!ast || typeof ast !== 'object') return null;
    const tipo = (ast as { type?: string }).type;
    if (tipo !== 'File' && tipo !== 'Program') return null; // evita traverse inválido

    try {
      traverse(ast as unknown as t.Node, {
        enter(path: NodePath<t.Node>) {
          const node = path.node;

          if (t.isVariableDeclaration(node) && node.kind === 'var') {
            incrementar(estatisticasUsoGlobal.vars, relPath);
            push({
              tipo: 'alerta',
              mensagem: `Uso de 'var' detectado. Prefira 'let' ou 'const'.`,
              arquivo: relPath,
              linha: node.loc?.start.line,
              coluna: node.loc?.start.column,
            });
          }
          if (t.isVariableDeclaration(node) && node.kind === 'let') {
            incrementar(estatisticasUsoGlobal.lets, relPath);
            push({
              tipo: 'info',
              mensagem: `Uso de 'let'. Considere 'const' se não houver reatribuição.`,
              arquivo: relPath,
              linha: node.loc?.start.line,
              coluna: node.loc?.start.column,
            });
          }
          if (t.isVariableDeclaration(node) && node.kind === 'const') {
            incrementar(estatisticasUsoGlobal.consts, relPath);
          }
          if (t.isCallExpression(node) && t.isIdentifier(node.callee)) {
            const nome = node.callee.name;
            if (nome === 'require') {
              incrementar(estatisticasUsoGlobal.requires, relPath);
              if (relPath.endsWith('.ts')) {
                push({
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
              push({
                tipo: 'critico',
                mensagem: `Uso de 'eval' detectado. Evite por questões de segurança e performance.`,
                arquivo: relPath,
                linha: node.loc?.start.line,
                coluna: node.loc?.start.column,
              });
            }
          }
          if (t.isExportNamedDeclaration(node) || t.isExportDefaultDeclaration(node)) {
            incrementar(estatisticasUsoGlobal.exports, relPath);
          }
          if (
            t.isAssignmentExpression(node) &&
            t.isMemberExpression(node.left) &&
            ((t.isIdentifier(node.left.object) &&
              node.left.object.name === 'module' &&
              t.isIdentifier(node.left.property) &&
              node.left.property.name === 'exports') ||
              (t.isIdentifier(node.left.object) && node.left.object.name === 'exports')) &&
            relPath.endsWith('.ts')
          ) {
            push({
              tipo: 'alerta',
              mensagem: `Uso de 'module.exports' ou 'exports' em arquivo TypeScript. Prefira 'export'.`,
              arquivo: relPath,
              linha: node.loc?.start.line,
              coluna: node.loc?.start.column,
            });
          }
          if (t.isWithStatement(node)) {
            incrementar(estatisticasUsoGlobal.withs, relPath);
            push({
              tipo: 'critico',
              mensagem: `Uso de 'with' detectado. Evite por questões de legibilidade e escopo.`,
              arquivo: relPath,
              linha: node.loc?.start.line,
              coluna: node.loc?.start.column,
            });
          }
          if (
            (t.isFunctionExpression(node) || t.isFunctionDeclaration(node)) &&
            !node.id &&
            !t.isArrowFunctionExpression(node)
          ) {
            push({
              tipo: 'info',
              mensagem: `Função anônima detectada. Considere nomear funções para melhor rastreabilidade.`,
              arquivo: relPath,
              linha: node.loc?.start.line,
              coluna: node.loc?.start.column,
            });
          }
          // Arrow function em propriedade de classe (Babel 7+: ClassProperty/PropertyDefinition)
          if (
            (node.type === 'ClassProperty' ||
              (node as { type?: string }).type === 'PropertyDefinition') &&
            'value' in (node as unknown as Record<string, unknown>) &&
            t.isArrowFunctionExpression(
              (node as unknown as Record<string, unknown>).value as t.Node,
            )
          ) {
            push({
              tipo: 'info',
              mensagem: `Arrow function usada como método de classe. Prefira método tradicional para melhor herança.`,
              arquivo: relPath,
              linha: node.loc?.start.line,
              coluna: node.loc?.start.column,
            });
          }
        },
      });
    } catch (e) {
      ocorrencias.push(
        ocorrenciaErroAnalista({
          mensagem: `Falha ao analisar padrões de uso em ${relPath}: ${(e as Error).message}`,
          relPath,
          origem: 'analista-padroes-uso',
        }),
      );
    }

    return garantirArray(ocorrencias);
  },
};
