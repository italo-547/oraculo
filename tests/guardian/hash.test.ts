// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';
import { gerarHashHex, gerarSnapshotDoConteudo } from '../../src/guardian/hash.js';
import { getHashes, createHash } from 'node:crypto';

vi.mock('../../src/guardian/constantes.js', () => ({
  ALGORITMO_HASH: 'sha256',
}));

describe('hash helpers', () => {
  it('usa algoritmo suportado ou fallback', () => {
    const conteudo = 'amostra-de-conteudo';
    const disponiveis = new Set(getHashes());
    const candidatos = ['blake3', 'sha256', 'sha1', 'md5'];
    const esperadoAlg = candidatos.find((c) => disponiveis.has(c));
    const hash = gerarHashHex(conteudo);
    if (esperadoAlg) {
      const esperado = createHash(esperadoAlg).update(conteudo).digest('hex');
      expect(hash).toBe(esperado);
    } else {
      // fallback simples mínimo 8 chars
      expect(hash.length).toBeGreaterThanOrEqual(8);
    }
  });
  it('gera hash hexadecimal consistente', () => {
    const hash1 = gerarHashHex('abc');
    const hash2 = gerarHashHex('abc');
    const hash3 = gerarHashHex('def');
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('gera snapshot do conteúdo corretamente', () => {
    const conteudo = 'linha1\nl2\nl3';
    const hash = gerarSnapshotDoConteudo(conteudo);
    expect(hash).toBe(gerarHashHex(conteudo));
  });

  it('gera snapshot corretamente para conteúdo vazio', () => {
    const conteudo = '';
    const hash = gerarSnapshotDoConteudo(conteudo);
    expect(hash).toBe(gerarHashHex(conteudo));
  });
});
