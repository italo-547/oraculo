// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('analista-padroes-uso', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('aplicar coleta ocorrencias de var/let/require/eval/module.exports/with/anon/class-arrow em TS', async () => {
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (_node: any, visitors: any) => {
        const enter = visitors.enter as (p: { node: any }) => void;
        // var/let/const
        enter({
          node: {
            type: 'VariableDeclaration',
            kind: 'var',
            loc: { start: { line: 1, column: 0 } },
          },
        });
        enter({
          node: {
            type: 'VariableDeclaration',
            kind: 'let',
            loc: { start: { line: 2, column: 0 } },
          },
        });
        enter({
          node: {
            type: 'VariableDeclaration',
            kind: 'const',
            loc: { start: { line: 3, column: 0 } },
          },
        });
        // require / eval
        enter({
          node: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'require' },
            loc: { start: { line: 4, column: 0 } },
          },
        });
        enter({
          node: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'eval' },
            loc: { start: { line: 5, column: 0 } },
          },
        });
        // export declarations
        enter({ node: { type: 'ExportNamedDeclaration' } });
        enter({ node: { type: 'ExportDefaultDeclaration' } });
        // module.exports em TS
        enter({
          node: {
            type: 'AssignmentExpression',
            left: {
              type: 'MemberExpression',
              object: { type: 'Identifier', name: 'module' },
              property: { type: 'Identifier', name: 'exports' },
            },
            loc: { start: { line: 6, column: 0 } },
          },
        });
        // with statement
        enter({ node: { type: 'WithStatement', loc: { start: { line: 7, column: 0 } } } });
        // função anônima
        enter({
          node: {
            type: 'FunctionExpression',
            id: undefined,
            loc: { start: { line: 8, column: 0 } },
          },
        });
        // propriedade de classe com arrow function
        enter({
          node: {
            type: 'ClassProperty',
            value: { type: 'ArrowFunctionExpression' },
            loc: { start: { line: 9, column: 0 } },
          },
        });
      },
    }));
    // Mock de @babel/types para checks baseados em shape
    vi.doMock('@babel/types', () => ({
      isVariableDeclaration: (n: any) => n?.type === 'VariableDeclaration',
      isCallExpression: (n: any) => n?.type === 'CallExpression',
      isIdentifier: (n: any) => n?.type === 'Identifier',
      isExportNamedDeclaration: (n: any) => n?.type === 'ExportNamedDeclaration',
      isExportDefaultDeclaration: (n: any) => n?.type === 'ExportDefaultDeclaration',
      isAssignmentExpression: (n: any) => n?.type === 'AssignmentExpression',
      isMemberExpression: (n: any) => n?.type === 'MemberExpression',
      isWithStatement: (n: any) => n?.type === 'WithStatement',
      isFunctionExpression: (n: any) => n?.type === 'FunctionExpression',
      isFunctionDeclaration: (n: any) => n?.type === 'FunctionDeclaration',
      isArrowFunctionExpression: (n: any) => n?.type === 'ArrowFunctionExpression',
    }));

    const { analistaPadroesUso } = await import('../../src/analistas/analista-padroes-uso.js');
    const fakeAst = { type: 'File' };
    const contexto = {
      baseDir: '.',
      arquivos: [
        {
          fullPath: 'c/project/a.ts',
          relPath: 'a.ts',
          content: null,
          ast: fakeAst as any,
        },
      ],
    } as any;

    const ocorrencias = analistaPadroesUso.aplicar('', 'a.ts', fakeAst as any, undefined, contexto);
    expect(Array.isArray(ocorrencias)).toBe(true);
    const list = (Array.isArray(ocorrencias) ? ocorrencias : []) as any[];
    // Checagens de mensagens principais
    expect(list.some((o) => o.mensagem?.includes("Uso de 'var'"))).toBe(true);
    expect(list.some((o) => o.mensagem?.includes("Uso de 'let'"))).toBe(true);
    expect(list.some((o) => o.mensagem?.includes("Uso de 'require'"))).toBe(true);
    expect(list.some((o) => o.mensagem?.includes("Uso de 'eval'"))).toBe(true);
    expect(list.some((o) => o.mensagem?.includes('module.exports'))).toBe(true);
    expect(list.some((o) => o.mensagem?.includes("Uso de 'with'"))).toBe(true);
    expect(list.some((o) => o.mensagem?.includes('Função anônima'))).toBe(true);
    expect(
      list.some((o) => o.mensagem?.includes('Arrow function usada como método de classe')),
    ).toBe(true);
  });

  it('aplicar captura erro de traverse e gera ERRO_ANALISTA', async () => {
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: () => {
        throw new Error('boom');
      },
    }));
    vi.doMock('@babel/types', () => ({
      isVariableDeclaration: (n: any) => n?.type === 'VariableDeclaration',
      isCallExpression: (n: any) => n?.type === 'CallExpression',
      isIdentifier: (n: any) => n?.type === 'Identifier',
      isExportNamedDeclaration: (n: any) => n?.type === 'ExportNamedDeclaration',
      isExportDefaultDeclaration: (n: any) => n?.type === 'ExportDefaultDeclaration',
      isAssignmentExpression: (n: any) => n?.type === 'AssignmentExpression',
      isMemberExpression: (n: any) => n?.type === 'MemberExpression',
      isWithStatement: (n: any) => n?.type === 'WithStatement',
      isFunctionExpression: (n: any) => n?.type === 'FunctionExpression',
      isFunctionDeclaration: (n: any) => n?.type === 'FunctionDeclaration',
      isArrowFunctionExpression: (n: any) => n?.type === 'ArrowFunctionExpression',
    }));

    const { analistaPadroesUso } = await import('../../src/analistas/analista-padroes-uso.js');
    const fakeAst = { type: 'File' };
    const contexto = {
      baseDir: '.',
      arquivos: [
        {
          fullPath: 'c/project/a.ts',
          relPath: 'a.ts',
          content: null,
          ast: fakeAst as any,
        },
      ],
    } as any;

    const ocorrencias = analistaPadroesUso.aplicar('', 'a.ts', fakeAst as any, undefined, contexto);
    const list = (Array.isArray(ocorrencias) ? ocorrencias : []) as any[];
    expect(
      list.some((o) => o.tipo === 'ERRO_ANALISTA' && /Falha ao analisar/.test(o.mensagem)),
    ).toBe(true);
  });

  it('test aceita .js/.ts e rejeita outros; per-file funciona sem contexto (retorna lista vazia)', async () => {
    // Garante que traverse não lance nem gere ocorrências neste caso
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (_node: any, _visitors: any) => {
        // no-op
      },
    }));
    const { analistaPadroesUso } = await import('../../src/analistas/analista-padroes-uso.js');
    expect(analistaPadroesUso.test('file.ts')).toBe(true);
    expect(analistaPadroesUso.test('file.js')).toBe(true);
    expect(analistaPadroesUso.test('file.md')).toBe(false);
    const fakeAst = { type: 'File' };
    const res = analistaPadroesUso.aplicar('', 'a.ts', fakeAst as any, undefined, undefined as any);
    expect(Array.isArray(res) && res.length === 0).toBe(true);
  });
});
