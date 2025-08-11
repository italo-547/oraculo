import { traverse } from '../nucleo/constelacao/traverse.js';
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
    fullPath?: string,
    _contexto?: ContextoExecucao,
  ): TecnicaAplicarResultado {
    const ocorrencias: Ocorrencia[] = [];

    if (!ast) return [];


    function analisar(
      fn: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
      aninhamento: number = 0
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
      if (aninhamento > LIMITE_ANINHAMENTO) {
        ocorrencias.push({
          tipo: 'FUNCAO_ANINHADA',
          severidade: 1,
          nivel: 'aviso',
          relPath,
          arquivo: relPath,
          linha: fn.loc.start.line,
          mensagem: `Função aninhada em nível ${aninhamento} (máx: ${LIMITE_ANINHAMENTO})`,
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


    function analisarRecursivo(path: NodePath, aninhamento: number = 0) {
      if (
        path.isFunctionDeclaration() ||
        path.isFunctionExpression() ||
        path.isArrowFunctionExpression()
      ) {
        analisar(path.node as FunctionDeclaration | FunctionExpression | ArrowFunctionExpression, aninhamento);
        aninhamento++;
      }
      path.traverse({
        FunctionDeclaration(p) {
          analisarRecursivo(p, aninhamento + 1);
        },
        FunctionExpression(p) {
          analisarRecursivo(p, aninhamento + 1);
        },
        ArrowFunctionExpression(p) {
          analisarRecursivo(p, aninhamento + 1);
        },
      });
    }

    analisarRecursivo(ast, 0);

    return ocorrencias;
  },
};
