// SPDX-License-Identifier: MIT
// ...existing code...
import type { Ocorrencia } from '@tipos/tipos.js';
import { criarAnalista } from '@tipos/tipos.js';
import { config } from '@nucleo/constelacao/cosmos.js';
import type {
  FunctionDeclaration,
  FunctionExpression,
  ArrowFunctionExpression,
} from '@babel/types';
import type { NodePath } from '@babel/traverse';

const LIMITE_LINHAS = config.ANALISE_LIMITES?.FUNCOES_LONGAS?.MAX_LINHAS ?? 30;
const LIMITE_PARAMETROS = config.ANALISE_LIMITES?.FUNCOES_LONGAS?.MAX_PARAMETROS ?? 4;
const LIMITE_ANINHAMENTO = config.ANALISE_LIMITES?.FUNCOES_LONGAS?.MAX_ANINHAMENTO ?? 3;

export const analistaFuncoesLongas = criarAnalista({
  aplicar: function (src: string, relPath: string, ast: NodePath | null, _fullPath?: string) {
    const ocorrencias: Ocorrencia[] = [];

    const pushOcorrencia = (
      tipo: Ocorrencia['tipo'],
      nivel: NonNullable<Ocorrencia['nivel']>,
      linha: number,
      mensagem: string,
    ) => {
      ocorrencias.push({
        tipo,
        nivel,
        relPath,
        arquivo: relPath,
        linha,
        mensagem,
        origem: 'analista-funcoes-longas',
      });
    };

    function analisar(
      fn: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
      _aninhamento: number = 0,
    ): void {
      if (
        !fn.loc ||
        typeof fn.loc.start !== 'object' ||
        typeof fn.loc.end !== 'object' ||
        typeof fn.loc.start.line !== 'number' ||
        typeof fn.loc.end.line !== 'number' ||
        fn.loc.start.line < 1 ||
        fn.loc.end.line < fn.loc.start.line
      ) {
        return;
      }

      const startLine = fn.loc.start.line;
      const endLine = fn.loc.end.line;
      const linhas = endLine - startLine + 1;
      if (linhas > LIMITE_LINHAS) {
        pushOcorrencia(
          'FUNCAO_LONGA',
          'aviso',
          startLine,
          `Função com ${linhas} linhas (máx: ${LIMITE_LINHAS})`,
        );
      }

      if (fn.params && Array.isArray(fn.params) && fn.params.length > LIMITE_PARAMETROS) {
        pushOcorrencia(
          'MUITOS_PARAMETROS',
          'aviso',
          startLine,
          `Função com muitos parâmetros (${fn.params.length}, máx: ${LIMITE_PARAMETROS})`,
        );
      }

      // Verifica se a função está aninhada demais
      if (_aninhamento > LIMITE_ANINHAMENTO) {
        pushOcorrencia(
          'FUNCAO_ANINHADA',
          'aviso',
          startLine,
          `Função aninhada em nível ${_aninhamento} (máx: ${LIMITE_ANINHAMENTO})`,
        );
      }

      // Verifica se a função não tem comentário imediatamente acima
      if (fn.leadingComments == null || fn.leadingComments.length === 0) {
        pushOcorrencia('FUNCAO_SEM_COMENTARIO', 'info', startLine, `Função sem comentário acima.`);
      }
    }

    function analisarRecursivo(path: import('@babel/traverse').NodePath, aninhamento: number = 0) {
      const node = 'node' in path ? path.node : path;
      const type = (node as { type?: string }).type;
      if (
        type === 'FunctionDeclaration' ||
        type === 'FunctionExpression' ||
        type === 'ArrowFunctionExpression'
      ) {
        analisar(
          node as FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
          aninhamento,
        );
        aninhamento++;
      }
      if (typeof (path as { traverse?: unknown }).traverse === 'function') {
        (path as { traverse: (visitors: Record<string, (p: NodePath) => void>) => void }).traverse({
          FunctionDeclaration(p: NodePath) {
            analisarRecursivo(p, aninhamento + 1);
          },
          FunctionExpression(p: NodePath) {
            analisarRecursivo(p, aninhamento + 1);
          },
          ArrowFunctionExpression(p: NodePath) {
            analisarRecursivo(p, aninhamento + 1);
          },
        });
      }
    }

    // --- Fluxo centralizado e robusto ---
    // 1. NodePath real: use traverse e recursão
    if (ast && typeof ast.traverse === 'function') {
      analisarRecursivo(ast, 0);
      return ocorrencias;
    }

    // 2. AST puro ou mock: só processa body do File, nunca recursiona
    const fileNode =
      ast &&
      typeof ast === 'object' &&
      'node' in ast &&
      (ast as { node: unknown }).node &&
      (ast as { node: { type?: string; body?: unknown[] } }).node.type === 'File' &&
      Array.isArray((ast as { node: { body?: unknown[] } }).node.body)
        ? ((ast as { node: unknown }).node as unknown as { body: unknown[] })
        : ast &&
            typeof ast === 'object' &&
            (ast as { type?: string }).type === 'File' &&
            Array.isArray((ast as { body?: unknown[] }).body)
          ? (ast as unknown as { body: unknown[] })
          : null;

    if (fileNode) {
      const body = fileNode.body as unknown[];
      for (const child of body) {
        if (
          typeof child === 'object' &&
          child !== null &&
          ((child as { type?: string }).type === 'FunctionDeclaration' ||
            (child as { type?: string }).type === 'FunctionExpression' ||
            (child as { type?: string }).type === 'ArrowFunctionExpression')
        ) {
          analisar(child as FunctionDeclaration | FunctionExpression | ArrowFunctionExpression, 0);
        }
      }
      return ocorrencias;
    }

    // Se não for nenhum dos casos acima, retorna vazio
    return ocorrencias;
  },
  nome: 'analista-funcoes-longas',
  categoria: 'complexidade',
  descricao:
    'Detecta funcoes muito longas, com muitos parametros, aninhamento excessivo ou sem comentario',
  limites: {
    linhas: LIMITE_LINHAS,
    params: LIMITE_PARAMETROS,
    aninhamento: LIMITE_ANINHAMENTO,
  },
  test: (relPath: string): boolean => relPath.endsWith('.js') || relPath.endsWith('.ts'),
  global: false,
});
