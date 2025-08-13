import { describe, it, expect, vi } from 'vitest';

// Replica da lógica de fallback para comparação determinística
function fallbackAlg(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = (hash * 31 + content.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

describe('guardian/hash gerarHashHex fallback', () => {
  it('usa fallback quando nenhum algoritmo candidato está disponível', async () => {
    vi.resetModules();
    vi.mock('node:crypto', () => ({
      getHashes: () => [],
      createHash: () => ({
        update: () => ({
          digest: () => {
            throw new Error('não deveria usar createHash');
          },
        }),
      }),
    }));
    const { gerarHashHex } = await import('./hash.js');
    const input = 'conteudo-fallback';
    const resultado = gerarHashHex(input);
    expect(resultado).toBe(fallbackAlg(input));
    expect(resultado).toMatch(/^[0-9a-f]{8}$/);
  });
});
