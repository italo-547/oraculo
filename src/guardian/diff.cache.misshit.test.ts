// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import { diffSnapshots } from './diff.js';
import { config } from '../nucleo/constelacao/cosmos.js';

describe('diffSnapshots cache branch miss-hit', () => {
  it('cobre cenário onde cache tem chave mas valor undefined (não retorna early)', () => {
    const before = { a: '1' } as Record<string, string>;
    const after = { a: '1' } as Record<string, string>;
    const key = `${Object.keys(before).length}:${Object.keys(after).length}:>`; // proteção desabilitada
    (globalThis as any).__ORACULO_DIFF_CACHE__ = new Map([[key, undefined]]);
    config.GUARDIAN_ENFORCE_PROTECTION = false;
    const r = diffSnapshots(before, after);
    expect(r.removidos).toHaveLength(0);
  });
});
