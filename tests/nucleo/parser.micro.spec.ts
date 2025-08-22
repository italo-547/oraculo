import { describe, it, expect } from 'vitest';
import { decifrarSintaxe, PARSERS } from '../../src/nucleo/parser.js';

describe('nucleo/parser micro-tests', () => {
  it('PARSERS inclui .d.ts que retorna null', () => {
    const fn = PARSERS.get('.d.ts');
    expect(typeof fn).toBe('function');
    const r = fn!('export declare const x: number');
    expect(r).toBeNull();
  });

  it('decifrarSintaxe retorna null para extensão desconhecida', async () => {
    const r = await decifrarSintaxe('algum conteudo qualquer', '.foo');
    expect(r).toBeNull();
  });
});
