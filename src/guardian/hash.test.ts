import { describe, it, expect, vi } from 'vitest';
import { gerarHashHex, gerarSnapshotDoConteudo } from './hash.js';

vi.mock('./constantes.js', () => ({
  ALGORITMO_HASH: 'sha256',
}));

describe('hash helpers', () => {
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
