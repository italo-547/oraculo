// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import {
  parseNomeArquivo,
  destinoPara,
  normalizarRel,
  DEFAULT_OPCOES,
} from '../../src/zeladores/util/estrutura.js';

describe('util estrutura', () => {
  it('parseNomeArquivo: suporta dots/kebab/camel', () => {
    expect(parseNomeArquivo('oraculo.controller.ts')).toEqual({
      entidade: 'oraculo',
      categoria: 'controller',
    });
    expect(parseNomeArquivo('oraculo-controller.ts')).toEqual({
      entidade: 'oraculo',
      categoria: 'controller',
    });
    expect(parseNomeArquivo('OraculoController.ts')).toEqual({
      entidade: 'Oraculo',
      categoria: 'controller',
    });
  });

  it('destinoPara: domains por entidade quando habilitado', () => {
    const r1 = destinoPara('src/oraculo.controller.ts', 'src', true, DEFAULT_OPCOES.categoriasMapa);
    expect(r1.destinoDir).toBe('src/domains/oraculo/controllers');
  });

  it('destinoPara: flat quando domains desabilitado', () => {
    const r2 = destinoPara(
      'src/oraculo.controller.ts',
      'src',
      false,
      DEFAULT_OPCOES.categoriasMapa,
    );
    expect(r2.destinoDir).toBe('src/controllers');
  });

  it('normalizarRel: converte \\ em /', () => {
    expect(normalizarRel('src\\file.ts')).toBe('src/file.ts');
  });
});
