import { describe, it, expect, vi, beforeEach } from 'vitest';
import { salvarRegistros, carregarRegistros } from './registros.js';

vi.mock('../zeladores/util/persistencia.js', () => ({
    salvarEstado: vi.fn().mockResolvedValue(undefined),
    lerEstado: vi.fn().mockResolvedValue([]),
}));
vi.mock('node:fs', () => ({
    promises: {
        mkdir: vi.fn().mockResolvedValue(undefined),
    },
}));
vi.mock('path', () => ({
    default: { dirname: () => '/tmp', join: (...args: string[]) => args.join('/') },
    dirname: () => '/tmp',
    join: (...args: string[]) => args.join('/'),
}));
vi.mock('../nucleo/constelacao/log.js', () => ({
    log: {
        sucesso: vi.fn(),
        aviso: vi.fn(),
    },
}));
vi.mock('../nucleo/constelacao/cosmos.js', () => ({
    config: { STATE_DIR: '/tmp' },
}));
vi.mock('./hash.js', () => ({
    gerarSnapshotDoConteudo: vi.fn((c: string) => 'hash_' + c),
}));

describe('salvarRegistros', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('salva registros de arquivos válidos', async () => {
        const { salvarEstado } = await import('../zeladores/util/persistencia.js');
        const fileEntries = [
            { relPath: 'a', content: 'abc', fullPath: '/tmp/a' },
            { relPath: 'b', content: '', fullPath: '/tmp/b' }, // deve ser ignorado
        ];
        await salvarRegistros(fileEntries, '/tmp/test.json');
        expect(salvarEstado).toHaveBeenCalledWith('/tmp/test.json', [
            { arquivo: 'a', hash: 'hash_abc' },
        ]);
    });
});

describe('carregarRegistros', () => {
    it('retorna lista vazia se não existir', async () => {
        const { lerEstado } = await import('../zeladores/util/persistencia.js');
        (lerEstado as any).mockResolvedValue([]);
        const registros = await carregarRegistros('/tmp/test.json');
        expect(registros).toEqual([]);
    });

    it('retorna lista vazia e loga aviso se lerEstado lança erro', async () => {
        const { lerEstado } = await import('../zeladores/util/persistencia.js');
        const { log } = await import('../nucleo/constelacao/log.js');
        (lerEstado as any).mockRejectedValue(new Error('falha'));
        const registros = await carregarRegistros('/tmp/test.json');
        expect(registros).toEqual([]);
        expect(log.aviso).toHaveBeenCalledWith(expect.stringContaining('Nenhum registro encontrado'));
    });
});
