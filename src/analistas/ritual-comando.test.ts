import { describe, it, expect, vi, beforeEach } from 'vitest';

// O mock padrão só para os testes "comando válido"
vi.mock('../nucleo/constelacao/traverse.js', () => ({
  traverse: (node: any, visitors: any) => {
    if (node.type === 'File') {
      visitors.enter({
        node: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'onCommand' },
          arguments: [null, { type: 'FunctionDeclaration', body: { type: 'BlockStatement' } }],
        },
      });
    }
  },
}));
vi.mock('@babel/types', () => ({
  isCallExpression: (n: any) => n.type === 'CallExpression',
  isIdentifier: (n: any) => n.type === 'Identifier',
  isFunctionDeclaration: (n: any) => n.type === 'FunctionDeclaration',
  isFunctionExpression: (n: any) => n.type === 'FunctionExpression',
  isArrowFunctionExpression: (n: any) => n.type === 'ArrowFunctionExpression',
  isBlockStatement: (n: any) => n.type === 'BlockStatement',
  isStringLiteral: (n: any) => n.type === 'StringLiteral',
}));

describe('ritualComando', () => {
  // Garante que cada teste reimporta o módulo usando o mock de traverse correto
  beforeEach(() => {
    vi.resetModules();
  });
  it('detecta comandos duplicados', async () => {
    vi.resetModules();
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (node: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'onCommand' },
            arguments: [
              { type: 'StringLiteral', value: 'cmd1' },
              { type: 'FunctionDeclaration', body: { type: 'BlockStatement' } },
            ],
          },
        });
        visitors.enter({
          node: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'onCommand' },
            arguments: [
              { type: 'StringLiteral', value: 'cmd1' },
              { type: 'FunctionDeclaration', body: { type: 'BlockStatement' } },
            ],
          },
        });
      },
    }));
    const { ritualComando } = await import('./ritual-comando.js');
    const fakeAst = { node: { type: 'File' } };
    const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
    expect(
      Array.isArray(ocorrencias) &&
        ocorrencias.some(
          (o: any) => o.tipo === 'padrao-problematico' && o.mensagem.includes('duplicados'),
        ),
    ).toBe(true);
  });

  it('detecta handler anônimo', async () => {
    vi.resetModules();
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (node: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'onCommand' },
            arguments: [
              { type: 'StringLiteral', value: 'cmd2' },
              { type: 'FunctionDeclaration', id: null, body: { type: 'BlockStatement' } },
            ],
          },
        });
      },
    }));
    const { ritualComando } = await import('./ritual-comando.js');
    const fakeAst = { node: { type: 'File' } };
    const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
    // Log temporário para depuração
    // eslint-disable-next-line no-console
    console.log('OCORRENCIAS handler anônimo:', JSON.stringify(ocorrencias, null, 2));
    // Deve haver pelo menos uma ocorrência padrao-problematico com mensagem de anônima
    const problematicas = (Array.isArray(ocorrencias) ? ocorrencias : []).filter(
      (o: any) => o.tipo === 'padrao-problematico',
    );
    expect(problematicas.some((o: any) => o.mensagem.includes('anônima'))).toBe(true);
  });

  it('ignora handler inválido (não função)', async () => {
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (node: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'onCommand' },
            arguments: [
              { type: 'StringLiteral', value: 'cmd3' },
              { type: 'Literal', value: 42 },
            ],
          },
        });
      },
    }));
    const { ritualComando } = await import('./ritual-comando.js');
    const fakeAst = { node: { type: 'File' } };
    const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
    expect(
      Array.isArray(ocorrencias) && ocorrencias.some((o: any) => o.tipo === 'padrao-problematico'),
    ).toBe(false);
  });

  it('ignora handler sem bloco de código', async () => {
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (node: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'onCommand' },
            arguments: [
              { type: 'StringLiteral', value: 'cmd4' },
              { type: 'FunctionDeclaration', id: { type: 'Identifier', name: 'f' } },
            ],
          },
        });
      },
    }));
    const { ritualComando } = await import('./ritual-comando.js');
    const fakeAst = { node: { type: 'File' } };
    const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
    expect(
      Array.isArray(ocorrencias) && ocorrencias.some((o: any) => o.tipo === 'padrao-problematico'),
    ).toBe(false);
  });
  it('extractHandlerInfo retorna null para node não função', async () => {
    const { extractHandlerInfo } = await import('./ritual-comando.js');
    expect(extractHandlerInfo({ type: 'Literal', value: 42 } as any)).toBeNull();
  });

  it('extractHandlerInfo cobre FunctionExpression e ArrowFunctionExpression', async () => {
    const { extractHandlerInfo } = await import('./ritual-comando.js');
    const funcExpr = { type: 'FunctionExpression', body: { type: 'BlockStatement' } };
    const arrowFunc = { type: 'ArrowFunctionExpression', body: { type: 'BlockStatement' } };
    const resultFunc = extractHandlerInfo(funcExpr as any);
    const resultArrow = extractHandlerInfo(arrowFunc as any);
    expect(resultFunc && resultFunc.func).toEqual(funcExpr);
    expect(resultFunc && resultFunc.bodyBlock).toEqual(funcExpr.body);
    expect(resultArrow && resultArrow.func).toEqual(arrowFunc);
    expect(resultArrow && resultArrow.bodyBlock).toEqual(arrowFunc.body);
  });
  it('detecta comando válido', async () => {
    const fakeAst = {
      node: { type: 'File' },
    };
    const { ritualComando } = await import('./ritual-comando.js');
    const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
    expect(Array.isArray(ocorrencias)).toBe(true);
    expect(Array.isArray(ocorrencias) ? ocorrencias.length : 0).toBe(0);
  });

  it('retorna erro se ast não for fornecido', async () => {
    const { ritualComando } = await import('./ritual-comando.js');
    const ocorrencias = ritualComando.aplicar('', 'bot.js', null, '', undefined);
    expect(Array.isArray(ocorrencias)).toBe(true);
    if (Array.isArray(ocorrencias)) {
      expect(ocorrencias[0].tipo).toBe('erro');
    }
  });

  it('retorna padrao-ausente se não houver comando', async () => {
    vi.resetModules();
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (node: any, visitors: any) => {
        // Não chama enter
      },
    }));
    const { ritualComando } = await import('./ritual-comando.js');
    const fakeAst = { node: { type: 'File' } };
    const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
    expect(Array.isArray(ocorrencias)).toBe(true);
    if (Array.isArray(ocorrencias)) {
      expect(ocorrencias.length).toBe(1);
      expect(ocorrencias[0].tipo).toBe('padrao-ausente');
    }
  });

  it('test cobre arquivos com e sem bot', async () => {
    const { ritualComando } = await import('./ritual-comando.js');
    expect(ritualComando.test('meubot.js')).toBe(true);
    expect(ritualComando.test('outro-arquivo.js')).toBe(false);
  });

  it('detecta comando válido com FunctionExpression', async () => {
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (node: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'onCommand' },
            arguments: [null, { type: 'FunctionExpression', body: { type: 'BlockStatement' } }],
          },
        });
      },
    }));
    const fakeAst = { node: { type: 'File' } };
    const { ritualComando } = await import('./ritual-comando.js');
    const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
    expect(Array.isArray(ocorrencias)).toBe(true);
    // Não deve haver ocorrências padrao-problematico
    const problematicas = (Array.isArray(ocorrencias) ? ocorrencias : []).filter(
      (o: any) => o.tipo === 'padrao-problematico',
    );
    expect(problematicas.length).toBe(0);
  });

  it('detecta comando válido com ArrowFunctionExpression', async () => {
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (node: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'registerCommand' },
            arguments: [
              null,
              { type: 'ArrowFunctionExpression', body: { type: 'BlockStatement' } },
            ],
          },
        });
      },
    }));
    const fakeAst = { node: { type: 'File' } };
    const { ritualComando } = await import('./ritual-comando.js');
    const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
    expect(Array.isArray(ocorrencias)).toBe(true);
    // Não deve haver ocorrências padrao-problematico
    const problematicas = (Array.isArray(ocorrencias) ? ocorrencias : []).filter(
      (o: any) => o.tipo === 'padrao-problematico',
    );
    expect(problematicas.length).toBe(0);
  });

  it('ignora handler inválido (sem bloco)', async () => {
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (node: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'onCommand' },
            arguments: [null, { type: 'FunctionDeclaration', body: { type: 'NotBlock' } }],
          },
        });
      },
    }));
    const fakeAst = { node: { type: 'File' } };
    const { ritualComando } = await import('./ritual-comando.js');
    const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
    // Não deve haver ocorrências padrao-problematico
    const problematicas = (Array.isArray(ocorrencias) ? ocorrencias : []).filter(
      (o: any) => o.tipo === 'padrao-problematico',
    );
    expect(problematicas.length).toBe(0);
  });

  it('ignora node que não é CallExpression', async () => {
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (node: any, visitors: any) => {
        visitors.enter({ node: { type: 'Literal', value: 42 } });
      },
    }));
    const fakeAst = { node: { type: 'File' } };
    const { ritualComando } = await import('./ritual-comando.js');
    const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
    // Não deve haver ocorrências padrao-problematico
    const problematicas = (Array.isArray(ocorrencias) ? ocorrencias : []).filter(
      (o: any) => o.tipo === 'padrao-problematico',
    );
    expect(problematicas.length).toBe(0);
  });

  it('ignora CallExpression cujo callee não é Identifier', async () => {
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (node: any, visitors: any) => {
        visitors.enter({
          node: { type: 'CallExpression', callee: { type: 'Literal', value: 42 }, arguments: [] },
        });
      },
    }));
    const fakeAst = { node: { type: 'File' } };
    const { ritualComando } = await import('./ritual-comando.js');
    const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
    // Não deve haver ocorrências padrao-problematico
    const problematicas = (Array.isArray(ocorrencias) ? ocorrencias : []).filter(
      (o: any) => o.tipo === 'padrao-problematico',
    );
    expect(problematicas.length).toBe(0);
  });

  it('ignora comando com handler ausente', async () => {
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (node: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'onCommand' },
            arguments: [null],
          },
        });
      },
    }));
    const fakeAst = { node: { type: 'File' } };
    const { ritualComando } = await import('./ritual-comando.js');
    const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
    // Não deve haver ocorrências padrao-problematico
    const problematicas = (Array.isArray(ocorrencias) ? ocorrencias : []).filter(
      (o: any) => o.tipo === 'padrao-problematico',
    );
    expect(problematicas.length).toBe(0);
  });

  it('ignora comando com handler que não é função', async () => {
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (node: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'onCommand' },
            arguments: [null, { type: 'Literal', value: 42 }],
          },
        });
      },
    }));
    const fakeAst = { node: { type: 'File' } };
    const { ritualComando } = await import('./ritual-comando.js');
    const ocorrencias = ritualComando.aplicar('', 'bot.js', fakeAst as any, '', undefined);
    // Não deve haver ocorrências padrao-problematico
    const problematicas = (Array.isArray(ocorrencias) ? ocorrencias : []).filter(
      (o: any) => o.tipo === 'padrao-problematico',
    );
    expect(problematicas.length).toBe(0);
  });
});
