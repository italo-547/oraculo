import { describe, it, expect, vi, beforeEach } from 'vitest';
import { config } from '../nucleo/constelacao/cosmos.js';

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
        STRUCTURE_PLUGINS: [] as string[],
        STRUCTURE_AUTO_FIX: true,
        STRUCTURE_CONCURRENCY: 1,
        STRUCTURE_LAYERS: {},
    } as {
        STRUCTURE_PLUGINS: string[];
        STRUCTURE_AUTO_FIX: boolean;
        STRUCTURE_CONCURRENCY: number;
        STRUCTURE_LAYERS: object;
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
        vi.resetModules();
        vi.clearAllMocks();
        config.STRUCTURE_AUTO_FIX = true;
        config.STRUCTURE_PLUGINS = [];
    });

    it('move arquivos quando ideal é diferente do atual', async () => {
        const { corrigirEstrutura } = await import('./corretor-estrutura.js');
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
        const { corrigirEstrutura } = await import('./corretor-estrutura.js');
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

    it('simula correção de estrutura (AUTO_FIX=false)', async () => {
        config.STRUCTURE_AUTO_FIX = false;
        const { corrigirEstrutura } = await import('./corretor-estrutura.js');
        const mapa = [
            { arquivo: 'src/c.ts', ideal: 'ideal', atual: 'src' },
        ];
        const fileEntries: import('../tipos/tipos.js').FileEntryWithAst[] = [
            { relPath: 'src/c.ts', fullPath: '/tmp/src/c.ts', ast: undefined as any, content: '' },
        ];
        await corrigirEstrutura(mapa, fileEntries, '/tmp');
        const { log } = await import('../nucleo/constelacao/log.js');
        // Verifica se alguma chamada de log.info contém 'Simular'
        const chamadas = (log.info as any).mock.calls.flat();
        console.log('LOG.INFO chamadas:', chamadas);
        expect(chamadas.some((msg: string) => msg.includes('Simular'))).toBe(true);
    });

    it('executa plugin válido e plugin com erro', async () => {
        (config.STRUCTURE_PLUGINS as string[]).splice(0, config.STRUCTURE_PLUGINS.length, './plugin-valido.js', './plugin-erro.js');
        // Mock do import dinâmico
        const pluginValido = vi.fn();
        const pluginErro = vi.fn(() => { throw new Error('erro plugin'); });
        vi.stubGlobal('import', async (mod: string) => {
            if (mod.endsWith('plugin-valido.js')) return { default: pluginValido };
            if (mod.endsWith('plugin-erro.js')) return { default: pluginErro };
            throw new Error('not found');
        });
        const { corrigirEstrutura } = await import('./corretor-estrutura.js');
        const mapa = [
            { arquivo: 'src/d.ts', ideal: 'ideal', atual: 'src' },
        ];
        const fileEntries: import('../tipos/tipos.js').FileEntryWithAst[] = [
            { relPath: 'src/d.ts', fullPath: '/tmp/src/d.ts', ast: undefined as any, content: '' },
        ];
        await corrigirEstrutura(mapa, fileEntries, '/tmp');
        const { log } = await import('../nucleo/constelacao/log.js');
        // Verifica se alguma chamada de log.aviso contém 'Plugin falhou'
        const chamadasAviso = (log.aviso as any).mock.calls.flat();
        console.log('LOG.AVISO chamadas:', chamadasAviso);
        expect(chamadasAviso.some((msg: string) => msg.includes('Plugin falhou'))).toBe(true);
        config.STRUCTURE_PLUGINS = [];
        vi.unstubAllGlobals();
    });
});
