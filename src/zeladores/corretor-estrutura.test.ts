import { describe, it, expect, vi, beforeEach } from 'vitest';
import { corrigirEstrutura } from './corretor-estrutura.js';

// Mock dependências externas
vi.mock('node:fs', () => ({
    promises: {
        mkdir: vi.fn().mockResolvedValue(undefined),
        stat: vi.fn().mockRejectedValue(new Error('not found')),
        rename: vi.fn().mockResolvedValue(undefined),
    },
}));
vi.mock('p-limit', () => ({
    default: () => (fn: any) => fn(),
}));
vi.mock('../nucleo/constelacao/cosmos.js', () => ({
    config: {
        STRUCTURE_PLUGINS: [],
        STRUCTURE_AUTO_FIX: true,
        STRUCTURE_CONCURRENCY: 1,
        STRUCTURE_LAYERS: {},
    },
}));
vi.mock('../nucleo/constelacao/log.js', () => ({
    log: {
        info: vi.fn(),
        erro: vi.fn(),
        sucesso: vi.fn(),
        aviso: vi.fn(),
    },
}));

describe('corrigirEstrutura', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('move arquivos quando ideal é diferente do atual', async () => {
        const mapa = [
            { arquivo: 'src/a.ts', ideal: 'dest', atual: 'src' },
        ];
        const fileEntries = [
            { relPath: 'src/a.ts', fullPath: '/tmp/src/a.ts', ast: undefined as any, content: '' },
        ];
        await corrigirEstrutura(mapa, fileEntries, '/tmp');
        // Espera chamada de mkdir e rename
        const { promises } = await import('node:fs');
        expect(promises.mkdir).toHaveBeenCalled();
        expect(promises.rename).toHaveBeenCalled();
    });

    it('não move se ideal for igual ao atual', async () => {
        const mapa = [
            { arquivo: 'src/b.ts', ideal: 'src', atual: 'src' },
        ];
        const fileEntries = [
            { relPath: 'src/b.ts', fullPath: '/tmp/src/b.ts', ast: undefined as any, content: '' },
        ];
        await corrigirEstrutura(mapa, fileEntries, '/tmp');
        const { promises } = await import('node:fs');
        expect(promises.rename).not.toHaveBeenCalled();
    });
});
