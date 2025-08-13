import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanSystemIntegrity } from './sentinela.js';

vi.mock('../nucleo/constelacao/log.js', () => ({
    log: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn() },
}));
vi.mock('./baseline.js', () => ({
    carregarBaseline: vi.fn(async () => ({})),
    salvarBaseline: vi.fn(async () => undefined),
}));
vi.mock('./diff.js', () => ({
    diffSnapshots: vi.fn(() => []),
    verificarErros: vi.fn(() => []),
}));
vi.mock('./hash.js', () => ({ gerarSnapshotDoConteudo: vi.fn((c: string) => 'h' + c) }));
vi.mock('./constantes.js', () => ({ BASELINE_PATH: '/tmp/b.json' }));
import { config } from '../nucleo/constelacao/cosmos.js';

describe('sentinela DEV_MODE branch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        config.DEV_MODE = true as any;
        // Configura ignore patterns para remover metade
        config.GUARDIAN_IGNORE_PATTERNS = ['ignore-me'];
    });

    it('loga estatística de filtragem quando DEV_MODE', async () => {
        const files = [
            { relPath: 'keep/file1.ts', content: 'a', fullPath: '/p/keep/file1.ts' },
            { relPath: 'ignore-me/file2.ts', content: 'b', fullPath: '/p/ignore-me/file2.ts' },
        ];
        const res = await scanSystemIntegrity(files as any);
        expect(res.status === 'ok' || res.status === 'baseline-criado').toBe(true);
        const { log } = await import('../nucleo/constelacao/log.js');
        const joined = (log.info as any).mock.calls.map((c: any) => c[0]).join('\n');
        expect(joined).toMatch(/Guardian filtro aplicado/);
    });
});
