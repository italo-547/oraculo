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

    it('exporta tecnicas como array', () => {
        expect(Array.isArray(inquisidor.tecnicas)).toBe(true);
    });

    it('exporta executarInquisicao', () => {
        expect(typeof inquisidor.executarInquisicao).toBe('function');
    });
});
