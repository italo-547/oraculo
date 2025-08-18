// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import { incrementar, garantirArray } from './helpers-analistas.js';

describe('helpers-analistas', () => {
  it('incrementar adiciona chave nova e incrementa existente', () => {
    const contador: Record<string, number> = {};
    incrementar(contador, 'x');
    incrementar(contador, 'x');
    incrementar(contador, 'y');
    expect(contador).toEqual({ x: 2, y: 1 });
  });

  it('garantirArray retorna array quando válido', () => {
    const arr = [1, 2, 3];
    expect(garantirArray(arr)).toBe(arr);
  });

  it('garantirArray normaliza null e undefined para []', () => {
    expect(garantirArray<number>(null as any)).toEqual([]);
    expect(garantirArray<number>(undefined as any)).toEqual([]);
  });

  it('garantirArray retorna [] se valor não for array', () => {
    expect(garantirArray<number>(123 as any)).toEqual([]);
  });
});
