import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as inquisidor from './inquisidor.js';

// Mocks
vi.mock('./scanner.js', () => ({
    scanRepository: vi.fn(async () => ({
        'file1.ts': { relPath: 'file1.ts', content: 'conteudo', fullPath: undefined },
        'file2.js': { relPath: 'file2.js', content: 'conteudo', fullPath: undefined },
    })),
}));
vi.mock('./parser.js', () => ({
    decifrarSintaxe: vi.fn(async () => ({ node: {}, parent: {} })),
}));
vi.mock('./executor.js', () => ({
    executarInquisicao: vi.fn(async () => ({ totalArquivos: 2, ocorrencias: [{}, {}] })),
}));
vi.mock('./constelacao/log.js', () => ({
    log: { info: vi.fn(), erro: vi.fn(), sucesso: vi.fn() },
}));
vi.mock('./constelacao/cosmos.js', () => ({
    config: { SCANNER_EXTENSOES_COM_AST: ['.ts', '.js'], GUARDIAN_BASELINE: 'baseline.json', ZELADOR_STATE_DIR: '.' },
}));
vi.mock('../analistas/detector-estrutura.js', () => ({ detectorEstrutura: vi.fn() }));
vi.mock('../analistas/detector-dependencias.js', () => ({ detectorDependencias: vi.fn() }));


describe('inquisidor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('iniciarInquisicao retorna resultado esperado', async () => {
        const resultado = await inquisidor.iniciarInquisicao('/fake', { includeContent: true, incluirMetadados: true });
        expect(resultado).toHaveProperty('totalArquivos', 2);
        expect(resultado).toHaveProperty('ocorrencias');
        expect(Array.isArray(resultado.arquivosAnalisados)).toBe(true);
        expect(resultado.fileEntries.length).toBe(2);
    });

    it('iniciarInquisicao funciona com incluirMetadados: false', async () => {
        const resultado = await inquisidor.iniciarInquisicao('/fake', { includeContent: true, incluirMetadados: false });
        expect(resultado).toHaveProperty('totalArquivos', 2);
        expect(resultado.fileEntries[0]).toHaveProperty('ast', undefined);
    });

    it('prepararComAst lida com erro em decifrarSintaxe e log.erro é chamado', async () => {
        vi.resetModules();
        // Mock log e parser antes do import
        const logMock = { erro: vi.fn(), info: vi.fn(), sucesso: vi.fn() };
        vi.doMock('./constelacao/log.js', () => ({ log: logMock }));
        vi.doMock('./parser.js', () => ({
            decifrarSintaxe: vi.fn(async () => { throw new Error('falha sintaxe'); })
        }));
        const { prepararComAst } = await import('./inquisidor.js');
        const entries = [{ relPath: 'file1.ts', content: 'conteudo', fullPath: undefined }];
        await prepararComAst(entries as any, '/fake');
        expect(logMock.erro).toHaveBeenCalledWith(expect.stringContaining('falha sintaxe'));
    });

    it('prepararComAst não chama path.resolve se fullPath já é string', async () => {
        const { prepararComAst } = await import('./inquisidor.js');
        const entries = [{ relPath: 'file1.ts', content: 'conteudo', fullPath: '/absoluto/file1.ts' }];
        const result = await prepararComAst(entries as any, '/fake');
        expect(result[0].fullPath).toBe('/absoluto/file1.ts');
    });

    it('EXTENSOES_COM_AST usa padrão se config.SCANNER_EXTENSOES_COM_AST não for array', async () => {
        vi.doMock('./constelacao/cosmos.js', () => ({ config: { SCANNER_EXTENSOES_COM_AST: undefined } }));
        const { prepararComAst } = await import('./inquisidor.js');
        const entries = [{ relPath: 'file1.ts', content: 'conteudo', fullPath: undefined }];
        // Não deve lançar erro
        await prepararComAst(entries as any, '/fake');
    });

    it('exporta tecnicas como array', () => {
        expect(Array.isArray(inquisidor.tecnicas)).toBe(true);
    });

    it('exporta executarInquisicao', () => {
        expect(typeof inquisidor.executarInquisicao).toBe('function');
    });
});
