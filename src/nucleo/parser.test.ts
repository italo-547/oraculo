import { describe, it, expect, vi, beforeEach } from 'vitest';
import { decifrarSintaxe, EXTENSOES_SUPORTADAS } from './parser.js';

vi.mock('./constelacao/log.js', () => ({
  log: { debug: vi.fn() },
}));

describe('parser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('decifra sintaxe de TypeScript válido', async () => {
    const codigo = 'const x: number = 42;';
    const ast = await decifrarSintaxe(codigo, '.ts');
    expect(ast).toBeDefined();
    expect(ast!.type).toBe('File');
  });

  it('retorna null para código inválido', async () => {
    const codigo = 'const = ;';
    const ast = await decifrarSintaxe(codigo, '.ts');
    expect(ast).toBeNull();
  });

  it('retorna null para extensão não suportada', async () => {
    const ast = await decifrarSintaxe('qualquer coisa', '.foo');
    expect(ast).toBeNull();
  });

  it('usa timeout se especificado', async () => {
    const codigo = 'const x = 1;';
    const ast = await decifrarSintaxe(codigo, '.ts', { timeoutMs: 10 });
    expect(ast).not.toBeNull(); // parser é síncrono, então não deve dar timeout
  });

  it('lista todas as extensões suportadas', () => {
    expect(EXTENSOES_SUPORTADAS).toEqual([
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.mjs',
      '.cjs',
      '.kt',
      '.kts',
      '.java',
      '.xml',
    ]);
  });

  it('retorna null e loga para parser Kotlin', async () => {
    const { log } = await import('./constelacao/log.js');
    const ast = await decifrarSintaxe('class X {}', '.kt');
    expect(ast).toBeNull();
    expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('Kotlin'));
  });

  it('retorna null e loga para parser Java', async () => {
    const { log } = await import('./constelacao/log.js');
    const ast = await decifrarSintaxe('class X {}', '.java');
    expect(ast).toBeNull();
    expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('Java'));
  });

  it('retorna null e loga para parser XML', async () => {
    const { log } = await import('./constelacao/log.js');
    const ast = await decifrarSintaxe('<xml></xml>', '.xml');
    expect(ast).toBeNull();
    expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('XML'));
  });
});
