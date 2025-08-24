// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';
import { analistaFuncoesLongas } from '../../src/analistas/analista-funcoes-longas.js';

vi.mock('../../src/nucleo/constelacao/traverse.js', () => ({
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
    // Deve haver pelo menos uma ocorrência do tipo FUNCAO_LONGA
    const funcoesLongas = (ocorrencias as any[]).filter((o) => o.tipo === 'FUNCAO_LONGA');
    expect(funcoesLongas.length).toBe(1);
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
    const { analistaFuncoesLongas } = await import(
      '../../src/analistas/analista-funcoes-longas.js'
    );
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
    const funcoesLongas = (ocorrencias as any[]).filter((o) => o.tipo === 'FUNCAO_LONGA');
    expect(funcoesLongas.length).toBe(1);
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
    const { analistaFuncoesLongas } = await import(
      '../../src/analistas/analista-funcoes-longas.js'
    );
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
    const funcoesLongas = (ocorrencias as any[]).filter((o) => o.tipo === 'FUNCAO_LONGA');
    expect(funcoesLongas.length).toBe(1);
  });

  it('test retorna true para .js e .ts', () => {
    expect(analistaFuncoesLongas.test('foo.js')).toBe(true);
    expect(analistaFuncoesLongas.test('foo.ts')).toBe(true);
    expect(analistaFuncoesLongas.test('foo.txt')).toBe(false);
  });

  it('ignora função curta (não retorna FUNCAO_LONGA)', () => {
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
    // Não deve haver ocorrência do tipo FUNCAO_LONGA
    const funcoesLongas = (ocorrencias as any[]).filter((o) => o.tipo === 'FUNCAO_LONGA');
    expect(funcoesLongas.length).toBe(0);
  });

  it('detecta função aninhada demais', () => {
    // Simula NodePath e traverse recursivo para aninhamento
    function makeNodePath(fn: any, max: number, level: number = 0): any {
      return {
        node: fn,
        traverse(visitors: any) {
          if (level < max) {
            visitors.FunctionDeclaration(makeNodePath(fn, max, level + 1));
          }
        },
      };
    }
    const fn = {
      type: 'FunctionDeclaration',
      loc: { start: { line: 1 }, end: { line: 2 } },
      params: [],
      leadingComments: [{}],
      body: { type: 'BlockStatement', body: [] },
    };
    // Cria NodePath com 5 níveis de aninhamento
    const fakeAst = makeNodePath(fn, 5);
    const ocorrencias = analistaFuncoesLongas.aplicar('', 'teste.js', fakeAst as any) as any[];
    const aninhadas = ocorrencias.filter((o) => o.tipo === 'FUNCAO_ANINHADA');
    expect(aninhadas.length).toBeGreaterThanOrEqual(1);
  });

  it('detecta função sem comentário', () => {
    const fakeAst = {
      node: {
        type: 'File',
        body: [
          {
            type: 'FunctionDeclaration',
            loc: { start: { line: 1 }, end: { line: 40 } },
            params: [],
            // sem leadingComments
          },
        ],
      },
    };
    const ocorrencias = analistaFuncoesLongas.aplicar('', 'teste.js', fakeAst as any) as any[];
    const semComentario = ocorrencias.filter((o) => o.tipo === 'FUNCAO_SEM_COMENTARIO');
    expect(semComentario.length).toBe(1);
  });

  it('detecta função com muitos parâmetros', () => {
    const fakeAst = {
      node: {
        type: 'File',
        body: [
          {
            type: 'FunctionDeclaration',
            loc: { start: { line: 1 }, end: { line: 10 } },
            params: [1, 2, 3, 4, 5],
            leadingComments: [{}],
          },
        ],
      },
    };
    const ocorrencias = analistaFuncoesLongas.aplicar('', 'teste.js', fakeAst as any) as any[];
    const muitosParams = ocorrencias.filter((o) => o.tipo === 'MUITOS_PARAMETROS');
    expect(muitosParams.length).toBe(1);
  });

  it('cobre AST alternativo (fileNode fallback)', () => {
    // fileNode sem .node, mas com type: 'File' e body
    const fakeAst = {
      type: 'File',
      body: [
        {
          type: 'FunctionDeclaration',
          loc: { start: { line: 1 }, end: { line: 40 } },
          params: [],
          leadingComments: [{}],
        },
      ],
    };
    const ocorrencias = analistaFuncoesLongas.aplicar('', 'teste.js', fakeAst as any);
    expect(Array.isArray(ocorrencias)).toBe(true);
    if (Array.isArray(ocorrencias)) {
      expect(ocorrencias.length).toBeGreaterThan(0);
    }
  });
});
