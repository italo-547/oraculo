import { describe, it, expect, vi, afterEach } from 'vitest';
import * as babelParser from '@babel/parser';
import { decifrarSintaxe } from '../../src/nucleo/parser.js';

afterEach(() => vi.restoreAllMocks());

describe('nucleo/parser additional fallbacks 2', () => {
  it('usa jsModernPlugins quando Babel falha e não parece Flow (.js)', async () => {
    vi.spyOn(babelParser, 'parse').mockImplementation((codigo: string, opts: any) => {
      const plugins = Array.isArray(opts?.plugins) ? opts.plugins : [];
      // Falha nas tentativas iniciais (defaultPlugins e flow), sucesso na tentativa jsModernPlugins
      if (plugins.includes('jsx') && !plugins.includes('typescript')) {
        return {
          type: 'File',
          program: { type: 'Program', body: [], sourceType: 'script', directives: [] },
          comments: [],
          tokens: [],
        } as any;
      }
      throw new Error('simulated babel failure');
    });

    const resultado = await decifrarSintaxe('const a = 1;', '.js');
    expect(resultado).not.toBeNull();
    expect((resultado as any).type).toBe('File');
  });

  it('usa tsc para .tsx quando Babel falha', async () => {
    vi.spyOn(babelParser, 'parse').mockImplementation(() => {
      throw new Error('force babel failure');
    });

    const codigo = 'const x: React.FC = () => <div />;';
    const resultado = await decifrarSintaxe(codigo, '.tsx');
    expect(resultado).not.toBeNull();
    expect((resultado as any).oraculoExtra?.lang).toBe('tsx-tsc');
  });
});
