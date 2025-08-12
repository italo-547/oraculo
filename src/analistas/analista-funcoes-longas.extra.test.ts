import { describe, it, expect, vi, beforeEach } from 'vitest';

// Testes extras visando aumentar branch coverage de analista-funcoes-longas

beforeEach(() => {
  vi.resetModules();
});

describe('analista-funcoes-longas (extra)', () => {
  it('não reporta FUNCAO_LONGA quando linhas == LIMITE (30)', async () => {
    const fakeAst = {
      node: {
        type: 'File',
        body: [
          {
            type: 'FunctionDeclaration',
            loc: { start: { line: 1 }, end: { line: 30 } },
            params: [],
            leadingComments: [{}],
          },
        ],
      },
    };
    const { analistaFuncoesLongas } = await import('./analista-funcoes-longas.js');
    const ocorrencias = analistaFuncoesLongas.aplicar('', 'a.ts', fakeAst as any) as any[];
    expect(ocorrencias.some((o) => o.tipo === 'FUNCAO_LONGA')).toBe(false);
  });

  it('não reporta MUITOS_PARAMETROS quando params == LIMITE (4)', async () => {
    const fakeAst = {
      node: {
        type: 'File',
        body: [
          {
            type: 'FunctionDeclaration',
            loc: { start: { line: 1 }, end: { line: 5 } },
            params: [1, 2, 3, 4],
            leadingComments: [{}],
          },
        ],
      },
    };
    const { analistaFuncoesLongas } = await import('./analista-funcoes-longas.js');
    const ocorrencias = analistaFuncoesLongas.aplicar('', 'a.ts', fakeAst as any) as any[];
    expect(ocorrencias.some((o) => o.tipo === 'MUITOS_PARAMETROS')).toBe(false);
  });

  it('fileNode fallback não recursiona em nested interno', async () => {
    // AST sem traverse; nested function deve ser ignorada (não aparece sem recursão)
    const outer = {
      type: 'FunctionDeclaration',
      loc: { start: { line: 1 }, end: { line: 10 } },
      params: [],
      leadingComments: [{}],
      body: {
        type: 'BlockStatement',
        body: [
          {
            type: 'FunctionDeclaration',
            loc: { start: { line: 2 }, end: { line: 3 } },
            params: [],
            leadingComments: [{}],
            body: { type: 'BlockStatement', body: [] },
          },
        ],
      },
    };
    const fakeAst = { node: { type: 'File', body: [outer] } };
    const { analistaFuncoesLongas } = await import('./analista-funcoes-longas.js');
    const ocorrencias = analistaFuncoesLongas.aplicar('', 'a.ts', fakeAst as any) as any[];
    // Deve haver ocorrências apenas referentes à externa (sem comentário caso removido)
    const linhas = ocorrencias.map((o) => o.linha);
    expect(linhas.every((l) => l === 1)).toBe(true);
  });

  it('retorna vazio para AST irreconhecível', async () => {
    const weirdAst = { foo: 'bar' } as any;
    const { analistaFuncoesLongas } = await import('./analista-funcoes-longas.js');
    const ocorrencias = analistaFuncoesLongas.aplicar('', 'a.ts', weirdAst) as any[];
    expect(Array.isArray(ocorrencias)).toBe(true);
    expect(ocorrencias.length).toBe(0);
  });
});
