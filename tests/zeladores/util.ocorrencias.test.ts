// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import { dedupeOcorrencias, agruparAnalistas } from '../../src/zeladores/util/ocorrencias.js';

describe('util/ocorrencias', () => {
  it('dedupeOcorrencias deve remover duplicados preservando a primeira ocorrência', () => {
    const arr = [
      { relPath: 'a.ts', linha: 1, tipo: 'X', mensagem: 'm' },
      { relPath: 'a.ts', linha: 1, tipo: 'X', mensagem: 'm' },
      { relPath: 'a.ts', linha: 2, tipo: 'X', mensagem: 'm' },
      { relPath: 'b.ts', linha: 1, tipo: 'Y', mensagem: 'n' },
      { relPath: 'a.ts', linha: 1, tipo: 'X', mensagem: 'm' },
    ];
    const out = dedupeOcorrencias(arr);
    expect(out).toHaveLength(3);
    expect(out[0]).toEqual({ relPath: 'a.ts', linha: 1, tipo: 'X', mensagem: 'm' });
    expect(out).toEqual(
      expect.arrayContaining([
        { relPath: 'a.ts', linha: 1, tipo: 'X', mensagem: 'm' },
        { relPath: 'a.ts', linha: 2, tipo: 'X', mensagem: 'm' },
        { relPath: 'b.ts', linha: 1, tipo: 'Y', mensagem: 'n' },
      ]),
    );
  });

  it('agruparAnalistas deve somar ocorrências/duração e contar execuções por nome', () => {
    const analistas = [
      { nome: 'a', duracaoMs: 10, ocorrencias: 2, global: false },
      { nome: 'b', duracaoMs: 5, ocorrencias: 1, global: false },
      { nome: 'a', duracaoMs: 15, ocorrencias: 3, global: true },
    ];
    const out = agruparAnalistas(analistas as any);
    // Ordena por ocorrencias desc; 'a' tem 5 e vem antes de 'b'
    expect(out[0].nome).toBe('a');
    expect(out[0].ocorrencias).toBe(5);
    expect(out[0].duracaoMs).toBe(25);
    expect(out[0].execucoes).toBe(2);
    expect(out[0].global).toBe(true);

    expect(out[1].nome).toBe('b');
    expect(out[1].ocorrencias).toBe(1);
    expect(out[1].duracaoMs).toBe(5);
    expect(out[1].execucoes).toBe(1);
  });
});
