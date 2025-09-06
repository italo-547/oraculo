// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Testes extras focados em ramos não cobertos: ClassProperty com arrow, exports.* em TS e FunctionExpression anônima

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('analistaPadroesUso (extra)', () => {
  it('detecta arrow function como ClassProperty', async () => {
    await vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (_ast: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'ClassProperty',
            value: { type: 'ArrowFunctionExpression' },
            loc: { start: { line: 10 }, column: 2 },
          },
        });
      },
    }));
    const { analistaPadroesUso } = await import('../../src/analistas/analista-padroes-uso.js');
    const ocorrencias = analistaPadroesUso.aplicar(
      '',
      'classe.ts',
      { type: 'File' } as any,
      '',
      undefined as any,
    );
    expect(
      Array.isArray(ocorrencias) &&
        ocorrencias.some((o: any) =>
          o.mensagem?.includes('Arrow function usada como método de classe'),
        ),
    ).toBe(true);
  });

  it('ignora AssignmentExpression com objeto diferente de exports/module', async () => {
    await vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (_ast: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'AssignmentExpression',
            left: {
              type: 'MemberExpression',
              object: { type: 'Identifier', name: 'foo' },
              property: { type: 'Identifier', name: 'bar' },
            },
            loc: { start: { line: 5 }, column: 1 },
          },
        });
      },
    }));
    const { analistaPadroesUso } = await import('../../src/analistas/analista-padroes-uso.js');
    const ocorrencias = analistaPadroesUso.aplicar(
      '',
      'mod.ts',
      { type: 'File' } as any,
      '',
      undefined as any,
    );
    expect(Array.isArray(ocorrencias) && ocorrencias.length === 0).toBe(true);
  });

  it('detecta AssignmentExpression com module', async () => {
    await vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (_ast: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'AssignmentExpression',
            left: {
              type: 'MemberExpression',
              object: { type: 'Identifier', name: 'module' },
              // A implementação só alerta quando é module.exports (ou exports.*)
              property: { type: 'Identifier', name: 'exports' },
            },
            loc: { start: { line: 5 }, column: 1 },
          },
        });
      },
    }));
    const { analistaPadroesUso } = await import('../../src/analistas/analista-padroes-uso.js');
    const ocorrencias = analistaPadroesUso.aplicar(
      '',
      'mod.ts',
      { type: 'File' } as any,
      '',
      undefined as any,
    );
    expect(
      Array.isArray(ocorrencias) &&
        ocorrencias.some(
          (o: any) => o.tipo === 'alerta' && o.mensagem?.includes("'module.exports' ou 'exports'"),
        ),
    ).toBe(true);
  });

  it('ignora ClassProperty sem arrow function', async () => {
    await vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (_ast: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'ClassProperty',
            value: { type: 'Literal' },
            loc: { start: { line: 10 }, column: 2 },
          },
        });
      },
    }));
    const { analistaPadroesUso } = await import('../../src/analistas/analista-padroes-uso.js');
    const ocorrencias = analistaPadroesUso.aplicar(
      '',
      'classe.ts',
      { type: 'File' } as any,
      '',
      undefined as any,
    );
    expect(Array.isArray(ocorrencias) && ocorrencias.length === 0).toBe(true);
  });

  it('detecta FunctionExpression nomeada', async () => {
    await vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (_ast: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'FunctionExpression',
            id: { type: 'Identifier', name: 'foo' },
            loc: { start: { line: 3 }, column: 1 },
          },
        });
      },
    }));
    const { analistaPadroesUso } = await import('../../src/analistas/analista-padroes-uso.js');
    const ocorrencias = analistaPadroesUso.aplicar(
      '',
      'anon.js',
      { type: 'File' } as any,
      '',
      undefined as any,
    );
    expect(Array.isArray(ocorrencias) && ocorrencias.length === 0).toBe(true);
  });

  it('per-file permite ausência de contexto (retorna lista, possivelmente vazia)', async () => {
    // no-op traverse, não deve gerar ocorrências
    await vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (_ast: any, _visitors: any) => {},
    }));
    const { analistaPadroesUso } = await import('../../src/analistas/analista-padroes-uso.js');
    const ocorrencias = analistaPadroesUso.aplicar(
      '',
      'anon.js',
      { type: 'File' } as any,
      '',
      null as any,
    );
    expect(Array.isArray(ocorrencias) && ocorrencias.length === 0).toBe(true);
  });

  it('detecta uso de exports.* em TS', async () => {
    await vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (_ast: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'AssignmentExpression',
            left: {
              type: 'MemberExpression',
              object: { type: 'Identifier', name: 'exports' },
              property: { type: 'Identifier', name: 'handler' },
            },
            loc: { start: { line: 5 }, column: 1 },
          },
        });
      },
    }));
    const { analistaPadroesUso } = await import('../../src/analistas/analista-padroes-uso.js');
    const ocorrencias = analistaPadroesUso.aplicar(
      '',
      'mod.ts',
      { type: 'File' } as any,
      '',
      undefined as any,
    );
    expect(
      Array.isArray(ocorrencias) &&
        ocorrencias.some(
          (o: any) => o.tipo === 'alerta' && o.mensagem?.includes("'module.exports' ou 'exports'"),
        ),
    ).toBe(true);
  });

  it('detecta FunctionExpression anônima', async () => {
    await vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (_ast: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'FunctionExpression',
            id: null,
            loc: { start: { line: 3 }, column: 1 },
          },
        });
      },
    }));
    const { analistaPadroesUso } = await import('../../src/analistas/analista-padroes-uso.js');
    const ocorrencias = analistaPadroesUso.aplicar(
      '',
      'anon.js',
      { type: 'File' } as any,
      '',
      undefined as any,
    );
    expect(
      Array.isArray(ocorrencias) &&
        ocorrencias.some((o: any) => o.tipo === 'info' && o.mensagem?.includes('Função anônima')),
    ).toBe(true);
  });
});
