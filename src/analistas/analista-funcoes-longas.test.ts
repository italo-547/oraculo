import { describe, it, expect, vi } from 'vitest';
import { analistaFuncoesLongas } from './analista-funcoes-longas.js';

vi.mock('../nucleo/constelacao/traverse.js', () => ({
  traverse: (node: any, visitors: any) => {
    // Simula chamada para FunctionDeclaration com função longa
    if (node.type === 'File' && node.body && node.body[0]?.type === 'FunctionDeclaration') {
      visitors.FunctionDeclaration({ node: node.body[0] });
    }
  },
}));

describe('analistaFuncoesLongas', () => {
  it('detecta função longa', () => {
    const fakeAst = {
      node: {
        type: 'File',
        body: [
          {
            type: 'FunctionDeclaration',
            loc: { start: { line: 1 }, end: { line: 40 } },
          },
        ],
      },
    };
    const ocorrencias = analistaFuncoesLongas.aplicar(
      '',
      'teste.js',
      fakeAst as any,
      '',
      undefined,
      fakeAst,
    );
    expect(Array.isArray(ocorrencias) ? ocorrencias.length : 0).toBe(1);
    if (Array.isArray(ocorrencias)) {
      expect(ocorrencias[0].tipo).toBe('FUNCAO_LONGA');
    }
  });

  it('retorna [] se ast for nulo', () => {
    const ocorrencias = analistaFuncoesLongas.aplicar('', 'teste.js', null as any, '', undefined);
    expect(ocorrencias).toEqual([]);
  });

  it('ignora função sem loc', () => {
    const fakeAst = {
      node: {
        type: 'File',
        body: [
          {
            type: 'FunctionDeclaration',
            // sem loc
          },
        ],
      },
    };
    const ocorrencias = analistaFuncoesLongas.aplicar(
      '',
      'teste.js',
      fakeAst as any,
      '',
      undefined,
      fakeAst,
    );
    expect(ocorrencias).toHaveLength(0);
  });

  it('detecta FunctionExpression longa', async () => {
    vi.resetModules();
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (node: any, visitors: any) => {
        if (node.type === 'File' && node.body && node.body[0]?.type === 'FunctionExpression') {
          visitors.FunctionExpression({ node: node.body[0] });
        }
      },
    }));
    const { analistaFuncoesLongas } = await import('./analista-funcoes-longas.js');
    const fakeAst = {
      node: {
        type: 'File',
        body: [
          {
            type: 'FunctionExpression',
            loc: { start: { line: 1 }, end: { line: 50 } },
          },
        ],
      },
    };
    const ocorrencias = analistaFuncoesLongas.aplicar(
      '',
      'teste.js',
      fakeAst as any,
      '',
      undefined,
      fakeAst,
    );
    expect(Array.isArray(ocorrencias) ? ocorrencias.length : 0).toBe(1);
  });

  it('detecta ArrowFunctionExpression longa', async () => {
    vi.resetModules();
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (node: any, visitors: any) => {
        if (node.type === 'File' && node.body && node.body[0]?.type === 'ArrowFunctionExpression') {
          visitors.ArrowFunctionExpression({ node: node.body[0] });
        }
      },
    }));
    const { analistaFuncoesLongas } = await import('./analista-funcoes-longas.js');
    const fakeAst = {
      node: {
        type: 'File',
        body: [
          {
            type: 'ArrowFunctionExpression',
            loc: { start: { line: 1 }, end: { line: 60 } },
          },
        ],
      },
    };
    const ocorrencias = analistaFuncoesLongas.aplicar(
      '',
      'teste.js',
      fakeAst as any,
      '',
      undefined,
      fakeAst,
    );
    expect(Array.isArray(ocorrencias) ? ocorrencias.length : 0).toBe(1);
  });

  it('test retorna true para .js e .ts', () => {
    expect(analistaFuncoesLongas.test('foo.js')).toBe(true);
    expect(analistaFuncoesLongas.test('foo.ts')).toBe(true);
    expect(analistaFuncoesLongas.test('foo.txt')).toBe(false);
  });

  it('ignora função curta', () => {
    const fakeAst = {
      node: {
        type: 'File',
        body: [
          {
            type: 'FunctionDeclaration',
            loc: { start: { line: 1 }, end: { line: 10 } },
          },
        ],
      },
    };
    const ocorrencias = analistaFuncoesLongas.aplicar(
      '',
      'teste.js',
      fakeAst as any,
      '',
      undefined,
      fakeAst,
    );
    expect(ocorrencias).toHaveLength(0);
  });
});
