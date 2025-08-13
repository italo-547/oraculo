import { describe, it, expect, vi } from 'vitest';
import { gerarHashHex } from './hash.js';

// Forçar cenário onde ALGORITMO_HASH não existe e também sha256/sha1/md5 indisponíveis
vi.mock('./constantes.js', () => ({ ALGORITMO_HASH: 'algo-inexistente-xyz' }));

// Simula ambiente sem algoritmos suportados fazendo getHashes retornar vazio
vi.mock('node:crypto', async (orig) => {
    const real: any = await orig();
    return {
        ...real,
        getHashes: () => [],
        createHash: (alg: string) => {
            throw new Error('unsupported ' + alg);
        },
    };
});

describe('hash fallback', () => {
    it('cai no fallback simples quando nenhum algoritmo suportado', () => {
        const hash = gerarHashHex('conteudo-fallback');
        // fallback gera hash hex curto (padStart 8) -- não 64 chars
        expect(hash.length).toBe(8);
    });
});
