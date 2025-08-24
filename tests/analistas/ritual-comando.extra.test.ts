// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Testes adicionais para cobrir ramos não exercitados em ritual-comando
// Coberturas alvo: muitos parâmetros, handler longo (>30 statements), ausência de try/catch, ausência de logging,
// presença de try/catch e logging (para não gerar ocorrências), múltiplos comandos (padrao-estrutural)

beforeEach(() => {
  vi.resetModules();
});

function buildStatements(qtd: number) {
  return Array.from({ length: qtd }).map((_, i) => ({
    type: 'ExpressionStatement',
    loc: { start: { line: i + 1 } },
  }));
}

describe('ritualComando (extra)', () => {
  it('reporta muitos parâmetros', async () => {
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (_ast: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'onCommand' },
            arguments: [
              { type: 'StringLiteral', value: 'withParams' },
              {
                type: 'FunctionDeclaration',
                id: { type: 'Identifier', name: 'handler' },
                params: [{}, {}, {}, {}, {}], // 5 > 3
                body: { type: 'BlockStatement', body: [] },
                loc: { start: { line: 1 } },
              },
            ],
          },
        });
      },
    }));
    const { ritualComando } = await import('../../src/analistas/ritual-comando.js');
    const fakeAst = { node: { type: 'File' } };
    const ocorrencias = ritualComando.aplicar(
      'x',
      'bot.js',
      fakeAst as any,
      '',
      undefined,
    ) as any[];
    expect(ocorrencias.some((o) => o.mensagem?.includes('muitos parâmetros'))).toBe(true);
  });

  it('reporta handler longo (>30 statements)', async () => {
    const stmts = buildStatements(31);
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (_ast: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'registerCommand' },
            arguments: [
              { type: 'StringLiteral', value: 'long' },
              {
                type: 'FunctionExpression',
                body: { type: 'BlockStatement', body: stmts, start: 0, end: 10 },
                params: [],
                loc: { start: { line: 1 } },
              },
            ],
          },
        });
      },
    }));
    const { ritualComando } = await import('../../src/analistas/ritual-comando.js');
    const fakeAst = { node: { type: 'File' } };
    const ocorrencias = ritualComando.aplicar(
      'abcdefghij',
      'bot.js',
      fakeAst as any,
      '',
      undefined,
    ) as any[];
    expect(ocorrencias.some((o) => o.mensagem?.includes('muito longo'))).toBe(true);
  });

  it('reporta ausência de try/catch e logging', async () => {
    const stmts = buildStatements(2); // 2 statements > 0
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (_ast: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'onCommand' },
            arguments: [
              { type: 'StringLiteral', value: 'noSafety' },
              {
                type: 'FunctionExpression',
                body: { type: 'BlockStatement', body: stmts, start: 0, end: 12 },
                params: [],
                loc: { start: { line: 1 } },
              },
            ],
          },
        });
      },
    }));
    const { ritualComando } = await import('../../src/analistas/ritual-comando.js');
    const fakeAst = { node: { type: 'File' } };
    const conteudo = 'no logs here';
    const ocorrencias = ritualComando.aplicar(
      conteudo,
      'bot.js',
      fakeAst as any,
      '',
      undefined,
    ) as any[];
    const boas = ocorrencias.filter((o) => o.tipo === 'boa-pratica-ausente');
    expect(boas.some((o) => o.mensagem.includes('try/catch'))).toBe(true);
    expect(boas.some((o) => o.mensagem.includes('não faz log'))).toBe(true);
  });

  it('não reporta ausência quando há try/catch e logging', async () => {
    const stmts = [{ type: 'TryStatement' }, { type: 'ExpressionStatement' }];
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (_ast: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'onCommand' },
            arguments: [
              { type: 'StringLiteral', value: 'safe' },
              {
                type: 'FunctionDeclaration',
                id: { type: 'Identifier', name: 'safe' },
                params: [],
                body: { type: 'BlockStatement', body: stmts, start: 0, end: 40 },
                loc: { start: { line: 1 } },
              },
            ],
          },
        });
      },
    }));
    const { ritualComando } = await import('../../src/analistas/ritual-comando.js');
    const fakeAst = { node: { type: 'File' } };
    const conteudo = 'try { /* code */ } catch(e){} console.log("ok");';
    const ocorrencias = ritualComando.aplicar(
      conteudo,
      'bot.js',
      fakeAst as any,
      '',
      undefined,
    ) as any[];
    expect(ocorrencias.filter((o) => o.tipo === 'boa-pratica-ausente').length).toBe(0);
  });

  it('gera padrao-estrutural para múltiplos comandos', async () => {
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (_ast: any, visitors: any) => {
        const cmd = (nome: string) => ({
          node: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'onCommand' },
            arguments: [
              { type: 'StringLiteral', value: nome },
              {
                type: 'FunctionDeclaration',
                id: { type: 'Identifier', name: nome },
                body: { type: 'BlockStatement', body: [], start: 0, end: 5 },
                loc: { start: { line: 1 } },
              },
            ],
          },
        });
        visitors.enter(cmd('a'));
        visitors.enter(cmd('b'));
      },
    }));
    const { ritualComando } = await import('../../src/analistas/ritual-comando.js');
    const fakeAst = { node: { type: 'File' } };
    const ocorrencias = ritualComando.aplicar(
      'x',
      'bot.js',
      fakeAst as any,
      '',
      undefined,
    ) as any[];
    expect(ocorrencias.some((o) => o.tipo === 'padrao-estrutural')).toBe(true);
  });
});
