// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import { registroAnalistas } from '../../src/analistas/registry.js';

describe('Contrato registroAnalistas', () => {
  it('todos possuem aplicar função', () => {
    for (const a of registroAnalistas) {
      expect(typeof (a as any).aplicar).toBe('function');
    }
  });

  it('nomes únicos (quando definidos)', () => {
    const nomes = registroAnalistas.map((a) => (a as any).nome).filter(Boolean) as string[];
    const set = new Set(nomes);
    expect(set.size).toBe(nomes.length);
  });
});
