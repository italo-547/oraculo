import { describe, it, expect } from 'vitest';
import { sanitizarFlags, validarCombinacoes } from './validacao.js';

describe('validacao util', () => {
  it('rejeita combinação scan-only + incremental', () => {
    const erros = validarCombinacoes({ scanOnly: true, incremental: true });
    expect(erros.length).toBe(1);
    expect(erros[0].codigo).toBe('SCAN_INCREMENTAL');
  });

  it('sanitizarFlags lança erro em combinação inválida', () => {
    expect(() => sanitizarFlags({ scanOnly: true, incremental: true })).toThrow(/SCAN_INCREMENTAL/);
  });

  it('aceita flags independentes válidas', () => {
    expect(() => sanitizarFlags({ scanOnly: true })).not.toThrow();
    expect(() => sanitizarFlags({ incremental: true })).not.toThrow();
  });
});
