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
    rootAst?: any,
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
    function analisarRecursivo(path: any, aninhamento: number = 0) {
      const node = path.node || path;
      const type = node.type;
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
      if (typeof path.traverse === 'function') {
        path.traverse({
          FunctionDeclaration(p: any) {
            analisarRecursivo(p, aninhamento + 1);
          },
          FunctionExpression(p: any) {
            analisarRecursivo(p, aninhamento + 1);
          },
          ArrowFunctionExpression(p: any) {
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
      ast && ast.node && ast.node.type === 'File' && Array.isArray((ast.node as any).body)
        ? ast.node
        : ast && ast.type === 'File' && Array.isArray((ast as any).body)
          ? ast
          : null;

    if (fileNode) {
      const body = (fileNode as any).body;
      for (const child of body) {
        if (
          child.type === 'FunctionDeclaration' ||
          child.type === 'FunctionExpression' ||
          child.type === 'ArrowFunctionExpression'
        ) {
          analisar(child, 0);
        }
      }
      return ocorrencias;
    }

    // Se não for nenhum dos casos acima, retorna vazio
    return ocorrencias;
  },
};
