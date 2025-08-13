import { describe, it, expect, vi } from 'vitest';

describe('diffSnapshots cache', () => {
  it('reutiliza resultado em chamadas subsequentes (cache hit)', async () => {
    vi.resetModules();
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: { GUARDIAN_ENFORCE_PROTECTION: true },
    }));
    const { diffSnapshots } = await import('./diff.js');
    const before = { a: '1', b: '2' };
    const after = { a: '1', b: '3' };
    const r1 = diffSnapshots(before, after);
    expect(r1.alterados).toEqual(['b']);
    const globAny = globalThis as unknown as { __ORACULO_DIFF_CACHE_HITS__?: number };
    const hitsBefore = globAny.__ORACULO_DIFF_CACHE_HITS__ || 0;
    const r2 = diffSnapshots(before, after);
    expect(r2).toBe(r1);
    const hitsAfter = globAny.__ORACULO_DIFF_CACHE_HITS__ || 0;
    expect(hitsAfter).toBe(hitsBefore + 1);
  });
});
