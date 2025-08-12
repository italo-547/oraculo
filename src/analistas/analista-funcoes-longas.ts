// ...existing code...
import type { Ocorrencia, TecnicaAplicarResultado, ContextoExecucao } from '../tipos/tipos.js';
import type {
  FunctionDeclaration,
  FunctionExpression,
  ArrowFunctionExpression,
} from '@babel/types';
import type { NodePath } from '@babel/traverse';

const LIMITE_LINHAS = 30;
const LIMITE_PARAMETROS = 4;
const LIMITE_ANINHAMENTO = 3;

export const analistaFuncoesLongas = {
  nome: 'analista-funcoes-longas',
  test: (relPath: string): boolean => relPath.endsWith('.js') || relPath.endsWith('.ts'),
  global: false,

  aplicar(
    src: string,
    relPath: string,
    ast: NodePath | null,
    _fullPath?: string,
    _contexto?: ContextoExecucao,
  ): TecnicaAplicarResultado {
    const ocorrencias: Ocorrencia[] = [];

    if (!ast) return [];

    function analisar(
      fn: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
      _aninhamento: number = 0,
    ): void {
      if (!fn.loc) return;

      const linhas = fn.loc.end.line - fn.loc.start.line + 1;
      if (linhas > LIMITE_LINHAS) {
        ocorrencias.push({
          tipo: 'FUNCAO_LONGA',
          severidade: 2,
          nivel: 'aviso',
          relPath,
          arquivo: relPath,
          linha: fn.loc.start.line,
          mensagem: `Função com ${linhas} linhas (máx: ${LIMITE_LINHAS})`,
          origem: 'analista-funcoes-longas',
        });
      }

      if (fn.params && fn.params.length > LIMITE_PARAMETROS) {
        ocorrencias.push({
          tipo: 'MUITOS_PARAMETROS',
          severidade: 1,
          nivel: 'aviso',
          relPath,
          arquivo: relPath,
          linha: fn.loc.start.line,
          mensagem: `Função com muitos parâmetros (${fn.params.length}, máx: ${LIMITE_PARAMETROS})`,
          origem: 'analista-funcoes-longas',
        });
      }

      // Verifica se a função está aninhada demais
      if (_aninhamento > LIMITE_ANINHAMENTO) {
        ocorrencias.push({
          tipo: 'FUNCAO_ANINHADA',
          severidade: 1,
          nivel: 'aviso',
          relPath,
          arquivo: relPath,
          linha: fn.loc.start.line,
          mensagem: `Função aninhada em nível ${_aninhamento} (máx: ${LIMITE_ANINHAMENTO})`,
          origem: 'analista-funcoes-longas',
        });
      }

      // Verifica se a função não tem comentário imediatamente acima
      if (fn.leadingComments == null || fn.leadingComments.length === 0) {
        ocorrencias.push({
          tipo: 'FUNCAO_SEM_COMENTARIO',
          severidade: 1,
          nivel: 'info',
          relPath,
          arquivo: relPath,
          linha: fn.loc.start.line,
          mensagem: `Função sem comentário acima.`,
          origem: 'analista-funcoes-longas',
        });
      }
    }

    // Função recursiva para NodePath real
    function analisarRecursivo(
      path:
        | NodePath
        | { node: unknown; traverse?: (visitors: Record<string, (p: NodePath) => void>) => void },
      aninhamento: number = 0,
    ) {
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
};
