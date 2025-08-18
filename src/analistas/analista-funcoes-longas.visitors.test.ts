// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';

import { analistaFuncoesLongas } from './analista-funcoes-longas.js';

// Exercita especificamente os visitors FunctionExpression e ArrowFunctionExpression dentro de analisarRecursivo
// para cobrir linhas antes não executadas.
describe('analista-funcoes-longas visitors adicionais', () => {
  it('dispara analisar para FunctionExpression e ArrowFunctionExpression via traverse', () => {
    const functionExpressionNode: any = {
      type: 'FunctionExpression',
      loc: { start: { line: 10 }, end: { line: 15 } },
      params: [1, 2, 3, 4, 5], // > limite para gerar MUITOS_PARAMETROS
      leadingComments: [],
    };
    const arrowFunctionNode: any = {
      type: 'ArrowFunctionExpression',
      loc: { start: { line: 20 }, end: { line: 60 } }, // 41 linhas > limite
      params: [],
      leadingComments: [],
    };

    const fakeAst: any = {
      node: { type: 'File' },
      traverse(visitors: Record<string, (p: any) => void>) {
        // Simula duas visitas diferentes
        visitors.FunctionExpression({ node: functionExpressionNode });
        visitors.ArrowFunctionExpression({ node: arrowFunctionNode });
      },
    };

    const resultadoArr = analistaFuncoesLongas.aplicar(
      'ignored',
      'teste.js',
      fakeAst as any,
    ) as any[];

    // Esperamos ocorrências de: muitos parâmetros (FunctionExpression), função longa (Arrow), e ambas sem comentário
    const tipos = resultadoArr.map((o) => o.tipo).sort();
    expect(tipos).toContain('MUITOS_PARAMETROS');
    expect(tipos).toContain('FUNCAO_LONGA');
    // Duas funções sem comentário
    const semComentario = resultadoArr.filter((o) => o.tipo === 'FUNCAO_SEM_COMENTARIO');
    expect(semComentario.length).toBeGreaterThanOrEqual(2);
  });
});
