// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import { analistaFuncoesLongas } from './analista-funcoes-longas.js';

// Testes negativos cobrindo ramos onde NÃO devem ser geradas ocorrências específicas.
describe('analista-funcoes-longas (negativos)', () => {
  it('não gera FUNCAO_SEM_COMENTARIO quando há leadingComments', () => {
    const fn: any = {
      type: 'FunctionDeclaration',
      loc: { start: { line: 1 }, end: { line: 5 } }, // 5 linhas <= limite 30
      params: [1, 2], // <= limite 4
      leadingComments: [{ type: 'CommentLine', value: ' explicação' }],
    };
    const fakeAst: any = {
      node: { type: 'File', body: [fn] },
    };
    const ocorrencias = analistaFuncoesLongas.aplicar(
      'ignored',
      'arquivo.js',
      fakeAst as any,
    ) as any[];
    const tipos = ocorrencias.map((o) => o.tipo);
    expect(tipos).not.toContain('FUNCAO_SEM_COMENTARIO');
    expect(tipos).toHaveLength(0); // nenhum outro alerta
  });

  it('não gera FUNCAO_ANINHADA até o limite de aninhamento (<=3)', () => {
    function buildChain(depth: number, maxDepth: number): any {
      return {
        node: {
          type: 'FunctionDeclaration',
          loc: { start: { line: 100 + depth }, end: { line: 100 + depth } },
          params: [],
          leadingComments: [{ value: 'ok' }],
        },
        traverse(visitors: Record<string, (p: any) => void>) {
          if (depth < maxDepth) {
            visitors.FunctionDeclaration(buildChain(depth + 1, maxDepth));
          }
        },
      };
    }

    // maxDepth = 1 => gera níveis 0 e 1 apenas. Pela lógica interna (0 -> 2) não atinge >3.
    const root = buildChain(0, 1);
    const ast: any = {
      node: { type: 'File' },
      traverse(v: Record<string, (p: any) => void>) {
        v.FunctionDeclaration(root);
      },
    };

    const ocorrencias = analistaFuncoesLongas.aplicar('src', 'nested.js', ast as any) as any[];
    const tipos = ocorrencias.map((o) => o.tipo);
    expect(tipos).not.toContain('FUNCAO_ANINHADA');
  });
});
