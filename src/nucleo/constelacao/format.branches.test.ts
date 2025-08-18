// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import { formatMs, formatPct, formatCount, formatDiff, calcPctVar } from './format.js';

describe('format util branches', () => {
  it('cobre diferentes faixas de formatMs', () => {
    expect(formatMs(0.25)).toMatch(/ms/); // <1ms
    expect(formatMs(10)).toMatch(/10.0ms/); // <1000
    expect(formatMs(2500)).toMatch(/2.50s/); // segundos
    expect(formatMs(125000)).toMatch(/2m/); // minutos
  });
  it('cobre sinais e limites em formatPct', () => {
    expect(formatPct(-5)).toBe('-5.0%');
    expect(formatPct(5)).toBe('+5.0%');
    expect(formatPct(Number.NaN)).toBe('0.0%');
  });
  it('cobre formatCount escalas', () => {
    expect(formatCount(10)).toBe('10');
    expect(formatCount(1500)).toMatch(/k/);
    expect(formatCount(2_500_000)).toMatch(/M/);
  });
  it('cobre formatDiff e calcPctVar', () => {
    expect(formatDiff(undefined as any, 10)).toBe('-');
    expect(calcPctVar(undefined as any, 10)).toBe(0);
    expect(calcPctVar(0, 10)).toBe(0);
    expect(formatDiff(100, 110)).toMatch(/=>/);
  });
});
