/// <reference types="vitest" />
import { vi } from 'vitest';

describe('traverse wrapper', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('chama quando o módulo é função direta', async () => {
    const fake = vi.fn(() => 'ok');
    const mod = await import('../../src/nucleo/constelacao/traverse.js');
    (mod as any).__setTraverseModule(fake);
    const res = (mod as any).traverse(1, 2, 3);
    expect(fake).toHaveBeenCalledWith(1, 2, 3);
    expect(res).toBe('ok');
  });

  it('chama quando o módulo tem default', async () => {
    const fake = vi.fn(() => 'ok-default');
    const mod = await import('../../src/nucleo/constelacao/traverse.js');
    (mod as any).__setTraverseModule({ default: fake });
    const res = (mod as any).traverse('a');
    expect(fake as any).toHaveBeenCalledWith('a');
    expect(res).toBe('ok-default');
  });

  it('chama quando o módulo tem traverse property', async () => {
    const fake = vi.fn(() => 'ok-traverse-prop');
    const mod = await import('../../src/nucleo/constelacao/traverse.js');
    (mod as any).__setTraverseModule({ traverse: fake });
    const res = (mod as any).traverse('x', 'y');
    expect(fake).toHaveBeenCalledWith('x', 'y');
    expect(res).toBe('ok-traverse-prop');
  });

  it('lança erro quando nenhuma variação aplica', async () => {
    const mod = await import('../../src/nucleo/constelacao/traverse.js');
    (mod as any).__setTraverseModule({ notAFunction: 1 });
    expect(() => (mod as any).traverse()).toThrow(/Babel traverse não é uma função/);
  });
});
