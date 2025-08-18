// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';

// Testa caminho onde primeiros algoritmos falham e um subsequente funciona
vi.mock('./constantes.js', () => ({ ALGORITMO_HASH: 'blake3' }));

vi.mock('node:crypto', async (orig) => {
  const real: any = await orig();
  return {
    ...real,
    getHashes: () => ['sha1', 'sha256', 'md5'], // não inclui blake3 para forçar skip inicial
    createHash: (alg: string) => {
      if (alg === 'sha256') {
        throw new Error('falha sha256'); // força tentativa de próximo
      }
      // sha1 ou md5 funcionam
      const h = real.createHash(alg);
      return h;
    },
  };
});

describe('hash cascade candidatos', () => {
  it('tenta algoritmos em cascata até um bem sucedido após falha', async () => {
    const { gerarHashHex } = await import('./hash.js');
    const input = 'conteudo-cascade';
    const hash = gerarHashHex(input); // deve usar sha1
    expect(hash).toMatch(/^[0-9a-f]+$/);
    // comprimento típico sha1
    expect(hash.length).toBe(40);
  });
});
