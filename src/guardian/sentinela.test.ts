import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanSystemIntegrity, acceptNewBaseline } from './sentinela.js';

vi.mock('node:fs', () => ({
    promises: {
        mkdir: vi.fn().mockResolvedValue(undefined),
    },
}));
vi.mock('path', () => ({
    default: { dirname: () => '/tmp' },
    dirname: () => '/tmp',
}));
vi.mock('../nucleo/constelacao/log.js', () => ({
    log: {
        info: vi.fn(),
        erro: vi.fn(),
        sucesso: vi.fn(),
        aviso: vi.fn(),
    },
}));
vi.mock('./hash.js', () => ({
    gerarSnapshotDoConteudo: vi.fn((c: string) => 'hash_' + c),
}));
vi.mock('./baseline.js', () => ({
    carregarBaseline: vi.fn(),
    salvarBaseline: vi.fn(),
}));
vi.mock('./diff.js', () => ({
    diffSnapshots: vi.fn(() => []),
    verificarErros: vi.fn(() => []),
}));
vi.mock('./constantes.js', () => ({
    BASELINE_PATH: '/tmp/baseline.json',
}));
vi.mock('../tipos/tipos.js', async () => {
    const mod = await import('../tipos/tipos.js');
    return {
        ...mod,
        IntegridadeStatus: { Ok: 'ok', Criado: 'criado', Aceito: 'aceito', AlteracoesDetectadas: 'alt' },
        GuardianError: class extends Error { constructor(msg: string) { super(msg); } },
    };
});

describe('scanSystemIntegrity', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('cria baseline inicial se não existir', async () => {
        const { carregarBaseline, salvarBaseline } = await import('./baseline.js');
        (carregarBaseline as any).mockResolvedValue(null);
        const fileEntries = [{ relPath: 'a', content: 'abc', fullPath: '/tmp/a' }];
        const result = await scanSystemIntegrity(fileEntries);
        expect(result.status).toBe('criado');
        expect(salvarBaseline).toHaveBeenCalled();
    });

    it('aceita baseline se --aceitar', async () => {
        const { carregarBaseline, salvarBaseline } = await import('./baseline.js');
        (carregarBaseline as any).mockResolvedValue({ a: 'hash_abc' });
        const fileEntries = [{ relPath: 'a', content: 'abc', fullPath: '/tmp/a' }];
        const origArgv = process.argv;
        process.argv = [...origArgv, '--aceitar'];
        const result = await scanSystemIntegrity(fileEntries);
        expect(result.status).toBe('aceito');
        expect(salvarBaseline).toHaveBeenCalled();
        process.argv = origArgv;
    });

    it('retorna ok se não houver erros', async () => {
        const { carregarBaseline } = await import('./baseline.js');
        (carregarBaseline as any).mockResolvedValue({ a: 'hash_abc' });
        const fileEntries = [{ relPath: 'a', content: 'abc', fullPath: '/tmp/a' }];
        const result = await scanSystemIntegrity(fileEntries);
        expect(result.status).toBe('ok');
    });
});

describe('acceptNewBaseline', () => {
    it('salva novo baseline', async () => {
        const { salvarBaseline } = await import('./baseline.js');
        const fileEntries = [{ relPath: 'a', content: 'abc', fullPath: '/tmp/a' }];
        await acceptNewBaseline(fileEntries);
        expect(salvarBaseline).toHaveBeenCalled();
    });
});
