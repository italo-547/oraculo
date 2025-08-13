import { describe, it, expect } from 'vitest';
import {
  sanitizarFlags,
  validarCombinacoes,
  normalizarPathLocal,
  validarNumeroPositivo,
} from './validacao.js';

describe('validacao util', () => {
  it('normalizarPathLocal impede escape', () => {
    const base = process.cwd();
    expect(normalizarPathLocal('sub/dir')).toContain(base);
    expect(normalizarPathLocal('../..')).toBe(base);
  });
  it('validarNumeroPositivo aceita valores válidos e retorna null para vazio', () => {
    expect(validarNumeroPositivo(5, 'x')).toBe(5);
    expect(validarNumeroPositivo('7', 'x')).toBe(7);
    expect(validarNumeroPositivo('', 'x')).toBeNull();
  });
  it('validarNumeroPositivo rejeita negativo', () => {
    expect(() => validarNumeroPositivo(-1, 'x')).toThrow(/Valor inválido/);
  });
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
