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
    const { analistaPadroesUso } = await import('./analista-padroes-uso.js');
    const contexto = { arquivos: [{ ast: { type: 'File' }, relPath: 'classe.ts' }] };
    const ocorrencias = analistaPadroesUso.aplicar('', 'classe.ts', undefined, '', contexto as any);
    expect(
      Array.isArray(ocorrencias) &&
        ocorrencias.some((o: any) =>
          o.mensagem?.includes('Arrow function usada como método de classe'),
        ),
    ).toBe(true);
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
    const { analistaPadroesUso } = await import('./analista-padroes-uso.js');
    const contexto = { arquivos: [{ ast: { type: 'File' }, relPath: 'mod.ts' }] };
    const ocorrencias = analistaPadroesUso.aplicar('', 'mod.ts', undefined, '', contexto as any);
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
    const { analistaPadroesUso } = await import('./analista-padroes-uso.js');
    const contexto = { arquivos: [{ ast: { type: 'File' }, relPath: 'anon.js' }] };
    const ocorrencias = analistaPadroesUso.aplicar('', 'anon.js', undefined, '', contexto as any);
    expect(
      Array.isArray(ocorrencias) &&
        ocorrencias.some((o: any) => o.tipo === 'info' && o.mensagem?.includes('Função anônima')),
    ).toBe(true);
  });
});
