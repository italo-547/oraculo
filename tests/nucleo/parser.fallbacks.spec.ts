import { describe, it, expect, vi, afterEach } from 'vitest';
import * as babelParser from '@babel/parser';
import { decifrarSintaxe } from '../../src/nucleo/parser.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('nucleo/parser fallbacks', () => {
  it('tenta Flow plugins quando Babel falha inicialmente (.js)', async () => {
    vi.spyOn(babelParser, 'parse').mockImplementation((codigo: string, opts: any) => {
      const plugins = Array.isArray(opts?.plugins) ? opts.plugins : [];
      // Simula falha na primeira tentativa e sucesso quando plugins incluem 'flow'
      if (plugins.includes('flow')) {
        return {
          type: 'File',
          program: { type: 'Program', body: [], sourceType: 'script', directives: [] },
          comments: [],
          tokens: [],
        } as any;
      }
      throw new Error('simulated babel failure');
    });

    const resultado = await decifrarSintaxe('/* @flow */ const a: any = 1;', '.js');
    expect(resultado).not.toBeNull();
    expect((resultado as any).type).toBe('File');
  });

  it('usa TypeScript compiler quando Babel falha para .ts', async () => {
    vi.spyOn(babelParser, 'parse').mockImplementation(() => {
      throw new Error('force babel failure');
    });

    const resultado = await decifrarSintaxe('const x: number = 42;', '.ts');
    expect(resultado).not.toBeNull();
    // parseComTypeScript coloca oraculoExtra.lang como 'ts-tsc' quando parseia com tsc
    expect((resultado as any).oraculoExtra?.lang).toBe('ts-tsc');
  });
});
