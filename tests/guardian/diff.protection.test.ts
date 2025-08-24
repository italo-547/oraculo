// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import { diffSnapshots } from '../../src/guardian/diff.js';
import { config } from '../../src/nucleo/constelacao/cosmos.js';

describe('diffSnapshots proteção', () => {
  it('usa hashes quando GUARDIAN_ENFORCE_PROTECTION=true e faz cache hit', () => {
    config.GUARDIAN_ENFORCE_PROTECTION = true;
    const before = { 'a.txt': 'h1', 'b.txt': 'h2' };
    const after = { 'a.txt': 'h1', 'b.txt': 'X', 'c.txt': 'h3' };
    const r1 = diffSnapshots(before, after);
    expect(r1.alterados).toEqual(['b.txt']);
    expect(r1.adicionados).toEqual(['c.txt']);
    let hitsBefore = (globalThis as any).__ORACULO_DIFF_CACHE_HITS__ || 0;
    const r2 = diffSnapshots(before, after); // cache hit
    const hitsAfter = (globalThis as any).__ORACULO_DIFF_CACHE_HITS__ || 0;
    expect(r2).toBe(r1);
    expect(hitsAfter).toBeGreaterThan(hitsBefore);
  });
});
