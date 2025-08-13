import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectarFantasmas } from './fantasma.js';
import * as deps from '../analistas/detector-dependencias.js';

// Mock scanner para controlar fileMap
vi.mock('../nucleo/scanner.js', () => ({
  scanRepository: vi.fn(async () => ({
    'a.ts': { relPath: 'a.ts', fullPath: '/tmp/a.ts', content: 'x' },
    'b.ts': { relPath: 'b.ts', fullPath: '/tmp/b.ts', content: 'y' },
    'c.test.ts': { relPath: 'c.test.ts', fullPath: '/tmp/c.test.ts', content: 'z' },
  })),
}));

// Mock fs.stat para controlar mtime
vi.mock('node:fs', () => ({
  stat: vi.fn(async (fp: string) => ({ mtimeMs: Date.now() - 100 * 86_400_000 })),
  promises: { stat: vi.fn(async (fp: string) => ({ mtimeMs: Date.now() - 100 * 86_400_000 })) },
}));

describe('fantasma branches', () => {
  beforeEach(() => {
    // Limpa grafo original
    (deps.grafoDependencias as Map<string, Set<string>>).clear();
    process.env.GHOST_DAYS = '30';
  });

  it('não marca quando grafo vazio (segurança)', async () => {
    const res = await detectarFantasmas('/tmp');
    expect(res.total).toBe(0);
  });

  it('marca arquivos não referenciados e antigos quando grafo populado', async () => {
    deps.grafoDependencias.set('a.ts', new Set()); // arquivo a.ts sem deps
    deps.grafoDependencias.set('b.ts', new Set(['a.ts'])); // b depende de a (a referenciado)
    const res = await detectarFantasmas('/tmp');
    const nomes = res.fantasmas.map((f) => f.arquivo);
    expect(nomes).toContain('b.ts');
    expect(nomes).not.toContain('a.ts');
  });
});
