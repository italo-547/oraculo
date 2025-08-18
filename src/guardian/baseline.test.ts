// SPDX-License-Identifier: MIT
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const TEST_BASELINE = path.resolve('./tmp-baseline.json');

// Mocka o BASELINE_PATH para cada teste
vi.mock('./constantes.js', async (importOriginal) => {
  const mod = await importOriginal();
  return Object.assign({}, mod, { BASELINE_PATH: TEST_BASELINE });
});

describe('baseline helpers', () => {
  beforeEach(async () => {
    try {
      await fs.unlink(TEST_BASELINE);
    } catch {}
  });

  afterEach(async () => {
    try {
      await fs.unlink(TEST_BASELINE);
    } catch {}
  });

  it('salva e carrega baseline corretamente', async () => {
    const { salvarBaseline, carregarBaseline } = await import('./baseline.js');
    const snapshot = { 'file1.ts': 'hash1', 'file2.ts': 'hash2' };
    await salvarBaseline(snapshot);
    const lido = await carregarBaseline();
    expect(lido).toEqual(snapshot);
  });

  it('retorna null se baseline não existe', async () => {
    const { carregarBaseline } = await import('./baseline.js');
    const lido = await carregarBaseline();
    expect(lido).toBeNull();
  });
});
