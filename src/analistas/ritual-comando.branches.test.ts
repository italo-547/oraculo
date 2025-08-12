import { describe, it, expect, vi, beforeEach } from 'vitest';

// Objetivo: cobrir ramos restantes (comandosInvocados === 0 já coberto; aqui focar em: handler sem nome e sem comandoNome não reporta anônimo; handler com logging somente fora do slice; comando sem try/catch mas com logging global impede segunda ocorrência)

beforeEach(() => {
  vi.resetModules();
});

describe('ritualComando (branches)', () => {
  it('não reporta anônimo quando comandoNome vazio', async () => {
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (_ast: any, v: any) => {
        v.enter({
          node: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'onCommand' },
            arguments: [
              { type: 'Identifier', name: 'notString' },
              {
                type: 'FunctionDeclaration',
                id: null,
                body: { type: 'BlockStatement', body: [], start: 0, end: 5 },
                loc: { start: { line: 1 } },
              },
            ],
          },
        });
      },
    }));
    const { ritualComando } = await import('./ritual-comando.js');
    const fakeAst = { node: { type: 'File' } };
    const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any) as any[];
    expect(ocorrencias.some((o) => o.mensagem?.includes('anônima'))).toBe(false);
  });

  it('logging global evita ocorrência de ausência de logging no bodySlice vazio', async () => {
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (_ast: any, v: any) => {
        v.enter({
          node: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'onCommand' },
            arguments: [
              { type: 'StringLiteral', value: 'logCmd' },
              {
                type: 'FunctionExpression',
                body: {
                  type: 'BlockStatement',
                  body: [{ type: 'ExpressionStatement' }],
                  start: 1000,
                  end: 1001,
                },
                params: [],
                loc: { start: { line: 10 } },
              },
            ],
          },
        });
      },
    }));
    const { ritualComando } = await import('./ritual-comando.js');
    const conteudo = 'console.log("global")'; // sem trecho interno correspondendo ao slice fora do range => bodySlice vazio -> fallback para conteudo
    const fakeAst = { node: { type: 'File' } };
    const ocorrencias = ritualComando.aplicar(conteudo, 'bot.js', fakeAst as any) as any[];
    const semLogging = ocorrencias.filter((o) => o.mensagem?.includes('não faz log'));
    expect(semLogging.length).toBe(0);
  });
});
