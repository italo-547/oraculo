// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';

const TEST_BASELINE = 'tmp-baseline-extra.json';
vi.mock('../../src/guardian/constantes.js', async (orig) => {
  const mod: any = await orig();
  return Object.assign({}, mod || {}, { BASELINE_PATH: TEST_BASELINE });
});

beforeEach(() => {
  vi.resetModules();
});

describe('baseline (extra)', () => {
  it('carregarBaseline retorna null quando conteúdo não é objeto (array)', async () => {
    vi.doMock('../zeladores/util/persistencia.js', () => ({
      lerEstado: vi.fn(async () => []),
      salvarEstado: vi.fn(),
    }));
    const { carregarBaseline } = await import('../../src/guardian/baseline.js');
    const result = await carregarBaseline();
    expect(result).toBeNull();
  });

  it('carregarBaseline filtra valores não-string', async () => {
    vi.doMock('../zeladores/util/persistencia.js', () => ({
      lerEstado: vi.fn(async () => ({ a: 'hashA', b: 123, c: null, d: 'hashD', e: {} })),
      salvarEstado: vi.fn(),
    }));
    const { carregarBaseline } = await import('../../src/guardian/baseline.js');
    const result = await carregarBaseline();
    expect(result).toEqual({ a: 'hashA', d: 'hashD' });
  });

  it('carregarBaseline retorna null em erro de leitura', async () => {
    vi.doMock('../zeladores/util/persistencia.js', () => ({
      lerEstado: vi.fn(async () => {
        throw new Error('boom');
      }),
      salvarEstado: vi.fn(),
    }));
    const { carregarBaseline } = await import('../../src/guardian/baseline.js');
    const result = await carregarBaseline();
    expect(result).toBeNull();
  });
});
