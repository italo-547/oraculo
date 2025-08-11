import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executarInquisicao } from './executor.js';

vi.mock('./constelacao/log.js', () => ({
    log: {
        info: vi.fn(),
        erro: vi.fn(),
        sucesso: vi.fn(),
    },
}));

describe('executarInquisicao', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('executa técnicas globais e por arquivo, agregando ocorrências', async () => {
        const fileEntries = [
            { relPath: 'a', content: 'abc', fullPath: '/tmp/a', ast: undefined as any },
            { relPath: 'b', content: 'def', fullPath: '/tmp/b', ast: undefined as any },
        ];
        const tecnicas = [
            {
                nome: 'global1',
                global: true,
                aplicar: vi.fn().mockResolvedValue({ tipo: 'info', nivel: 'info', mensagem: 'ok', relPath: '', arquivo: '', linha: 0 }),
            },
            {
                nome: 'porArquivo',
                global: false,
                test: (relPath: string) => relPath === 'a',
                aplicar: vi.fn().mockResolvedValue([{ tipo: 'aviso', nivel: 'aviso', mensagem: 'warn', relPath: 'a', arquivo: 'a', linha: 1 }]),
            },
        ];
        const resultado = await executarInquisicao(fileEntries, tecnicas as any, '/tmp', {});
        expect(resultado.ocorrencias).toHaveLength(2);
        expect(tecnicas[0].aplicar).toHaveBeenCalled();
        expect(tecnicas[1].aplicar).toHaveBeenCalledWith('abc', 'a', null, '/tmp/a', expect.any(Object));
    });

    it('registra erro se técnica lança exceção', async () => {
        const fileEntries = [
            { relPath: 'a', content: 'abc', fullPath: '/tmp/a', ast: undefined as any },
        ];
        const tecnicas = [
            {
                nome: 'globalErr',
                global: true,
                aplicar: vi.fn().mockRejectedValue(new Error('fail')),
            },
        ];
        const resultado = await executarInquisicao(fileEntries, tecnicas as any, '/tmp', {});
        expect(resultado.ocorrencias[0].mensagem).toMatch(/Falha na técnica global/);
    });
});
