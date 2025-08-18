// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analistaPadroesUso, estatisticasUsoGlobal } from './analista-padroes-uso.js';

vi.mock('../nucleo/constelacao/traverse.js', () => ({
  traverse: (ast: any, visitors: any) => {
    // Simula um arquivo com const, require e export
    if (ast.type === 'File') {
      visitors.enter({ node: { type: 'VariableDeclaration', kind: 'const' } });
      visitors.enter({
        node: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'require' },
          arguments: [{ type: 'StringLiteral', value: 'mod' }],
        },
      });
      visitors.enter({ node: { type: 'ExportNamedDeclaration' } });
    }
  },
}));

beforeEach(() => {
  estatisticasUsoGlobal.requires = {};
  estatisticasUsoGlobal.consts = {};
  estatisticasUsoGlobal.exports = {};
  vi.resetModules();
});

describe('analistaPadroesUso', () => {
  it('detecta uso de var', async () => {
    vi.resetModules();
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (ast: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'VariableDeclaration',
            kind: 'var',
            loc: { start: { line: 1 }, column: 2 },
          },
        });
      },
    }));
    const { analistaPadroesUso } = await import('./analista-padroes-uso.js');
    const contexto = { arquivos: [{ ast: { type: 'File' }, relPath: 'teste.js' }] };
    const ocorrencias = analistaPadroesUso.aplicar('', 'teste.js', undefined, '', contexto as any);
    expect(
      Array.isArray(ocorrencias) &&
        ocorrencias.some((o: any) => o.tipo === 'alerta' && o.mensagem.includes("'var'")),
    ).toBe(true);
  });

  it('detecta uso de let', async () => {
    vi.resetModules();
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (ast: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'VariableDeclaration',
            kind: 'let',
            loc: { start: { line: 1 }, column: 2 },
          },
        });
      },
    }));
    const { analistaPadroesUso } = await import('./analista-padroes-uso.js');
    const contexto = { arquivos: [{ ast: { type: 'File' }, relPath: 'teste.js' }] };
    const ocorrencias = analistaPadroesUso.aplicar('', 'teste.js', undefined, '', contexto as any);
    expect(
      Array.isArray(ocorrencias) &&
        ocorrencias.some((o: any) => o.tipo === 'info' && o.mensagem.includes("'let'")),
    ).toBe(true);
  });

  it('detecta require em arquivo TS', async () => {
    vi.resetModules();
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (ast: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'require' },
            arguments: [{ type: 'StringLiteral', value: 'mod' }],
            loc: { start: { line: 1 }, column: 2 },
          },
        });
      },
    }));
    const { analistaPadroesUso } = await import('./analista-padroes-uso.js');
    const contexto = { arquivos: [{ ast: { type: 'File' }, relPath: 'teste.ts' }] };
    const ocorrencias = analistaPadroesUso.aplicar('', 'teste.ts', undefined, '', contexto as any);
    expect(
      Array.isArray(ocorrencias) &&
        ocorrencias.some((o: any) => o.tipo === 'alerta' && o.mensagem.includes('require')),
    ).toBe(true);
  });

  it('detecta uso de eval', async () => {
    vi.resetModules();
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (ast: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'eval' },
            arguments: [],
            loc: { start: { line: 1 }, column: 2 },
          },
        });
      },
    }));
    const { analistaPadroesUso } = await import('./analista-padroes-uso.js');
    const contexto = { arquivos: [{ ast: { type: 'File' }, relPath: 'teste.js' }] };
    const ocorrencias = analistaPadroesUso.aplicar('', 'teste.js', undefined, '', contexto as any);
    expect(
      Array.isArray(ocorrencias) &&
        ocorrencias.some((o: any) => o.tipo === 'critico' && o.mensagem.includes('eval')),
    ).toBe(true);
  });

  it('detecta uso de with', async () => {
    vi.resetModules();
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (ast: any, visitors: any) => {
        visitors.enter({ node: { type: 'WithStatement', loc: { start: { line: 1 }, column: 2 } } });
      },
    }));
    const { analistaPadroesUso } = await import('./analista-padroes-uso.js');
    const contexto = { arquivos: [{ ast: { type: 'File' }, relPath: 'teste.js' }] };
    const ocorrencias = analistaPadroesUso.aplicar('', 'teste.js', undefined, '', contexto as any);
    expect(
      Array.isArray(ocorrencias) &&
        ocorrencias.some((o: any) => o.tipo === 'critico' && o.mensagem.includes('with')),
    ).toBe(true);
  });

  it('detecta uso de module.exports em TS', async () => {
    vi.resetModules();
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (ast: any, visitors: any) => {
        visitors.enter({
          node: {
            type: 'AssignmentExpression',
            left: {
              type: 'MemberExpression',
              object: { type: 'Identifier', name: 'module' },
              property: { type: 'Identifier', name: 'exports' },
            },
            loc: { start: { line: 1 }, column: 2 },
          },
        });
      },
    }));
    const { analistaPadroesUso } = await import('./analista-padroes-uso.js');
    const contexto = { arquivos: [{ ast: { type: 'File' }, relPath: 'teste.ts' }] };
    const ocorrencias = analistaPadroesUso.aplicar('', 'teste.ts', undefined, '', contexto as any);
    expect(
      Array.isArray(ocorrencias) &&
        ocorrencias.some((o: any) => o.tipo === 'alerta' && o.mensagem.includes('module.exports')),
    ).toBe(true);
  });

  it('detecta função anônima', async () => {
    vi.resetModules();
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (ast: any, visitors: any) => {
        visitors.enter({
          node: { type: 'FunctionDeclaration', id: null, loc: { start: { line: 1 }, column: 2 } },
        });
      },
    }));
    const { analistaPadroesUso } = await import('./analista-padroes-uso.js');
    const contexto = { arquivos: [{ ast: { type: 'File' }, relPath: 'teste.js' }] };
    const ocorrencias = analistaPadroesUso.aplicar('', 'teste.js', undefined, '', contexto as any);
    expect(
      Array.isArray(ocorrencias) &&
        ocorrencias.some((o: any) => o.tipo === 'info' && o.mensagem.includes('anônima')),
    ).toBe(true);
  });
  it('acumula estatísticas de uso de const, require e export', () => {
    const contexto = {
      arquivos: [{ ast: { type: 'File' }, relPath: 'teste.js' }],
    };
    const ocorrencias = analistaPadroesUso.aplicar('', 'teste.js', undefined, '', contexto as any);
    expect(ocorrencias).toEqual([]);
    expect(estatisticasUsoGlobal.consts['teste.js']).toBe(1);
    expect(estatisticasUsoGlobal.requires['teste.js']).toBe(1);
    expect(estatisticasUsoGlobal.exports['teste.js']).toBe(1);
  });

  it('test retorna true para .js e .ts, false para outros', () => {
    expect(analistaPadroesUso.test('foo.js')).toBe(true);
    expect(analistaPadroesUso.test('foo.ts')).toBe(true);
    expect(analistaPadroesUso.test('foo.txt')).toBe(false);
  });

  it('ignora arquivo sem ast', () => {
    const contexto = { arquivos: [{ ast: null, relPath: 'teste.js' }] };
    const ocorrencias = analistaPadroesUso.aplicar('', 'teste.js', undefined, '', contexto as any);
    expect(ocorrencias).toEqual([]);
  });

  it('ignora nodes não relevantes', async () => {
    vi.resetModules();
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (ast: any, visitors: any) => {
        // node irrelevante
        visitors.enter({ node: { type: 'Literal' } });
      },
    }));
    const { analistaPadroesUso, estatisticasUsoGlobal } = await import('./analista-padroes-uso.js');
    const contexto = { arquivos: [{ ast: { type: 'File' }, relPath: 'teste.js' }] };
    const ocorrencias = analistaPadroesUso.aplicar('', 'teste.js', undefined, '', contexto as any);
    expect(ocorrencias).toEqual([]);
    expect(estatisticasUsoGlobal.consts['teste.js']).toBeUndefined();
    expect(estatisticasUsoGlobal.requires['teste.js']).toBeUndefined();
    expect(estatisticasUsoGlobal.exports['teste.js']).toBeUndefined();
  });

  it('acumula export default e named', async () => {
    vi.resetModules();
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (ast: any, visitors: any) => {
        visitors.enter({ node: { type: 'ExportDefaultDeclaration' } });
        visitors.enter({ node: { type: 'ExportNamedDeclaration' } });
      },
    }));
    const { analistaPadroesUso, estatisticasUsoGlobal } = await import('./analista-padroes-uso.js');
    const contexto = { arquivos: [{ ast: { type: 'File' }, relPath: 'teste.js' }] };
    analistaPadroesUso.aplicar('', 'teste.js', undefined, '', contexto as any);
    expect(estatisticasUsoGlobal.exports['teste.js']).toBe(2);
  });

  it('não acumula require se callee não for Identifier', async () => {
    vi.resetModules();
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (ast: any, visitors: any) => {
        visitors.enter({
          node: { type: 'CallExpression', callee: { type: 'Literal', value: 'require' } },
        });
      },
    }));
    const { analistaPadroesUso, estatisticasUsoGlobal } = await import('./analista-padroes-uso.js');
    const contexto = { arquivos: [{ ast: { type: 'File' }, relPath: 'teste.js' }] };
    analistaPadroesUso.aplicar('', 'teste.js', undefined, '', contexto as any);
    expect(estatisticasUsoGlobal.requires['teste.js']).toBeUndefined();
  });

  it('não acumula const se não for const', async () => {
    vi.resetModules();
    vi.doMock('../nucleo/constelacao/traverse.js', () => ({
      traverse: (ast: any, visitors: any) => {
        visitors.enter({ node: { type: 'VariableDeclaration', kind: 'let' } });
      },
    }));
    const { analistaPadroesUso, estatisticasUsoGlobal } = await import('./analista-padroes-uso.js');
    const contexto = { arquivos: [{ ast: { type: 'File' }, relPath: 'teste.js' }] };
    analistaPadroesUso.aplicar('', 'teste.js', undefined, '', contexto as any);
    expect(estatisticasUsoGlobal.consts['teste.js']).toBeUndefined();
  });

  it('retorna null se contexto não for fornecido', () => {
    expect(analistaPadroesUso.aplicar('', 'teste.js', undefined, '', undefined)).toBeNull();
  });
});
