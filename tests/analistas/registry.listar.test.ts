// SPDX-License-Identifier: MIT
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as registry from '../../src/analistas/registry.js';

describe('listarAnalistas', () => {
  let original: unknown[];

  beforeEach(() => {
    original = registry.registroAnalistas.slice();
  });

  afterEach(() => {
    registry.registroAnalistas.length = 0;
    registry.registroAnalistas.push(...(original as any));
  });

  it('mapeia campos quando definidos', () => {
    registry.registroAnalistas.length = 0;
    (registry.registroAnalistas as any).push({
      nome: 'Analista X',
      categoria: 'qualidade',
      descricao: 'faz analise',
      aplicar: () => {},
    });
    const out = registry.listarAnalistas();
    expect(out).toEqual([{ nome: 'Analista X', categoria: 'qualidade', descricao: 'faz analise' }]);
  });

  it('usa valores padrão quando campos ausentes', () => {
    registry.registroAnalistas.length = 0;
    (registry.registroAnalistas as any).push({ aplicar: () => {} });
    const out = registry.listarAnalistas();
    expect(out[0]).toEqual({ nome: 'desconhecido', categoria: 'n/d', descricao: '' });
  });
});
