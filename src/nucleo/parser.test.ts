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
      '.html',
      '.htm',
      '.css',
      '.gradle',
      '.gradle.kts',
    ]);
  });

  it('parser Kotlin retorna wrapper File com oraculoExtra', async () => {
    const { log } = await import('./constelacao/log.js');
    const ast = await decifrarSintaxe('class X {}', '.kt');
    expect(ast).not.toBeNull();
    expect(ast!.type).toBe('File');
    // @ts-ignore
    expect(ast!.oraculoExtra?.lang).toBe('kotlin');
    expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('Kotlin'));
  });

  it('parser Java retorna wrapper File com oraculoExtra', async () => {
    const { log } = await import('./constelacao/log.js');
    const ast = await decifrarSintaxe('class X {}', '.java');
    expect(ast).not.toBeNull();
    expect(ast!.type).toBe('File');
    // @ts-ignore
    expect(ast!.oraculoExtra?.lang).toBe('java');
    expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('Java'));
  });

  it('parser XML retorna wrapper File com oraculoExtra', async () => {
    const { log } = await import('./constelacao/log.js');
    const ast = await decifrarSintaxe('<xml></xml>', '.xml');
    expect(ast).not.toBeNull();
    expect(ast!.type).toBe('File');
    // @ts-ignore
    expect(ast!.oraculoExtra?.lang).toBe('xml');
    // Não exigimos log em caminho de sucesso; apenas garante que nenhuma chamada de erro foi feita
    const debugMock = log.debug as unknown as { mock: { calls: any[][] } };
    expect(debugMock.mock.calls.some((c: any[]) => String(c[0]).includes('Erro XML'))).toBeFalsy();
  });
});
