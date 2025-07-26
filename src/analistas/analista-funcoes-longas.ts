import { traverse } from '../nucleo/constelacao/traverse.js';
import config from '../nucleo/constelacao/cosmos.js';

import type {
  Ocorrencia,
  TecnicaAplicarResultado,
  ContextoExecucao
} from '../tipos/tipos.js';
import type { NodePath, Node, FunctionDeclaration, FunctionExpression, ArrowFunctionExpression } from '@babel/types';

const LIMITE_LINHAS = config.ZELADOR_LINE_THRESHOLD ?? 30;

export const analistaFuncoesLongas = {
  nome: 'analista-funcoes-longas',
  test: (relPath: string): boolean => relPath.endsWith('.js') || relPath.endsWith('.ts'),
  global: false,

  aplicar(
    src: string,
    relPath: string,
    ast: NodePath<Node> | null,
    fullPath: string,
    contexto?: ContextoExecucao
  ): TecnicaAplicarResultado {
    const ocorrencias: Ocorrencia[] = [];

    if (!ast) return [];

    function analisar(
      fn: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression
    ): void {
      if (!fn.loc) return;

      const linhas = fn.loc.end.line - fn.loc.start.line + 1;
      if (linhas > LIMITE_LINHAS) {
        ocorrencias.push({
          tipo: 'FUNCAO_LONGA',
          codigo: 'FUNCAO_LONGA',
          severidade: 2,
          nivel: 'aviso',
          relPath,
          arquivo: relPath,
          linha: fn.loc.start.line,
          mensagem: `Função com ${linhas} linhas (máx: ${LIMITE_LINHAS})`,
          origem: 'analista-funcoes-longas'
        });
      }
    }

    traverse(ast, {
      FunctionDeclaration(path) {
        analisar(path.node);
      },
      FunctionExpression(path) {
        analisar(path.node);
      },
      ArrowFunctionExpression(path) {
        analisar(path.node);
      }
    });

    return ocorrencias;
  }
};