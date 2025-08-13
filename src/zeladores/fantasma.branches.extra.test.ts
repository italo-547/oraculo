import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectarFantasmas } from './fantasma.js';
import * as deps from '../analistas/detector-dependencias.js';

vi.mock('../nucleo/scanner.js', () => ({
  scanRepository: vi.fn(async () => ({
    'src/index.ts': { relPath: 'src/index.ts', fullPath: '/tmp/src/index.ts', content: '' },
    'src/recent.ts': { relPath: 'src/recent.ts', fullPath: '/tmp/src/recent.ts', content: '' },
    'types.d.ts': { relPath: 'types.d.ts', fullPath: '/tmp/types.d.ts', content: '' },
    'my.config.ts': { relPath: 'my.config.ts', fullPath: '/tmp/my.config.ts', content: '' },
  })),
}));

vi.mock('node:fs', () => ({
  stat: vi.fn(async (fp: string) => {
    const now = Date.now();
    if (fp.endsWith('recent.ts')) return { mtimeMs: now - 5 * 86_400_000 }; // 5 dias (abaixo do limiar 30)
    return { mtimeMs: now - 100 * 86_400_000 };
  }),
  promises: { stat: vi.fn(async () => ({ mtimeMs: Date.now() - 100 * 86_400_000 })) },
}));

describe('fantasma exclusões adicionais', () => {
  beforeEach(() => {
    (deps.grafoDependencias as Map<string, Set<string>>).clear();
    deps.grafoDependencias.set('dummy.ts', new Set()); // grafo populado mas sem referência aos alvos
    process.env.GHOST_DAYS = '30';
  });

  it('não marca index.ts, .d.ts e config.ts (recent pode variar)', async () => {
    const res = await detectarFantasmas('/tmp');
    const nomes = res.fantasmas.map((f) => f.arquivo);
    expect(nomes).not.toContain('src/index.ts');
    expect(nomes).not.toContain('types.d.ts');
    expect(nomes).not.toContain('my.config.ts');
  });
});
