// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import { formatMs, formatPct, formatCount, formatDiff, calcPctVar } from './format.js';

describe('format utils', () => {
  it('formatMs basics', () => {
    expect(formatMs(0.123)).toMatch(/0\.12ms/);
    expect(formatMs(12)).toBe('12.0ms');
    expect(formatMs(1500)).toBe('1.50s');
  });
  it('formatPct sign and rounding', () => {
    expect(formatPct(0)).toBe('0.0%');
    expect(formatPct(1.234)).toBe('+1.2%');
    // -2.25 arredonda para -2.3 com toFixed(1)
    expect(formatPct(-2.25)).toBe('-2.3%');
  });
  it('formatCount thresholds', () => {
    expect(formatCount(999)).toBe('999');
    expect(formatCount(1500)).toBe('1.5k');
    expect(formatCount(2_500_000)).toBe('2.50M');
  });
  it('formatDiff', () => {
    const diff = formatDiff(100, 150);
    expect(diff).toMatch(/100\.0ms => 150\.0ms/);
    expect(diff).toMatch(/\+50\.0%/);
  });
  it('calcPctVar', () => {
    expect(calcPctVar(100, 150)).toBe(50);
    expect(calcPctVar(undefined, 10)).toBe(0);
  });
});
