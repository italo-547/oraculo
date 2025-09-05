/// <reference types="vitest" />
import { vi } from 'vitest';

describe('detector-node', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('retorna vazio quando não há package.json', async () => {
    const mod = await import('../../src/analistas/detectores/detector-node.js');
    const res = (mod as any).detectarArquetipoNode(['src/a.ts']);
    expect(res).toEqual([]);
  });

  it('retorna candidatos quando package.json presente', async () => {
    // Mock ARQUETIPOS e scoreArquetipo
    vi.mock('../../src/analistas/arquetipos-defs.js', async (importOriginal) => {
      await importOriginal();
      return { ARQUETIPOS: ['x', 'y'] } as any;
    });
    vi.mock('../../src/analistas/deteccao/pontuador.js', async (importOriginal) => {
      await importOriginal();
      return { scoreArquetipo: (d: any) => ({ score: d === 'x' ? 5 : 0, nome: d }) } as any;
    });
    const mod = await import('../../src/analistas/detectores/detector-node.js');
    const res = (mod as any).detectarArquetipoNode(['package.json', 'src/a.ts']);
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].score).toBe(5);
  });
});
