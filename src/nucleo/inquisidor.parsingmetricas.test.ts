import { describe, it, expect, vi } from 'vitest';
import { prepararComAst } from './inquisidor.js';
import { config } from './constelacao/cosmos.js';

vi.mock('./parser.js', () => ({
  decifrarSintaxe: vi.fn(async () => ({ node: { type: 'File', body: [] }, parent: null })),
}));
import { decifrarSintaxe } from './parser.js';

import path from 'node:path';
import fs from 'node:fs/promises';

function entry(p: string, c: string) {
  return { relPath: p, content: c, fullPath: path.join(process.cwd(), p) } as any;
}

describe('parsing métricas', () => {
  it('contabiliza miss na primeira rodada e hits na segunda', async () => {
    config.ANALISE_AST_CACHE_ENABLED = true;
    await fs.writeFile(path.join(process.cwd(), 'file1.ts'), 'export const a=1');
    await fs.writeFile(path.join(process.cwd(), 'file2.ts'), 'export const b=2');
    // Primeira rodada -> apenas miss
    await prepararComAst(
      [entry('file1.ts', 'export const a=1'), entry('file2.ts', 'export const b=2')],
      process.cwd(),
    );
    const m1 = (globalThis as any).__ORACULO_METRICAS__;
    expect(m1.cacheMiss).toBeGreaterThanOrEqual(2);
    expect(m1.cacheHits).toBe(0);
    expect(m1.parsingTimeMs).toBeGreaterThan(0);
    // Segunda rodada -> hits esperados
    await prepararComAst(
      [entry('file1.ts', 'export const a=1'), entry('file2.ts', 'export const b=2')],
      process.cwd(),
    );
    const m2 = (globalThis as any).__ORACULO_METRICAS__;
    expect(m2.cacheHits).toBeGreaterThanOrEqual(2);
    expect(m2.cacheMiss).toBe(0); // após reset, somente hits
  });
});
