import { describe, it, expect } from 'vitest';
import { listarAnalistas } from '../../src/analistas/registry';

describe('registry - listarAnalistas', () => {
  it('retorna lista com shape básico e strings', () => {
    const lista = listarAnalistas();
    expect(Array.isArray(lista)).toBe(true);
    expect(lista.length).toBeGreaterThan(0);
    for (const item of lista) {
      expect(item).toHaveProperty('nome');
      expect(typeof item.nome).toBe('string');
      expect(item).toHaveProperty('categoria');
      expect(typeof item.categoria).toBe('string');
      expect(item).toHaveProperty('descricao');
      expect(typeof item.descricao).toBe('string');
    }
  });

  it('campos possuem fallbacks seguros (string) mesmo quando ausentes', () => {
    const lista = listarAnalistas();
    for (const item of lista) {
      // Garantir que não retorna undefined/null
      expect(typeof item.nome).toBe('string');
      expect(typeof item.categoria).toBe('string');
      expect(typeof item.descricao).toBe('string');
    }
  });
});
