import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanRepository } from './scanner.js';

// Mocks
const fakeDirent = (name: string, isDir: boolean = false) => ({
    name,
    isDirectory: () => isDir,
    isSymbolicLink: () => false,
});

vi.mock('micromatch', () => ({
    default: { isMatch: () => false },
    isMatch: () => false,
}));
vi.mock('../zeladores/util/persistencia.js', () => ({
    lerEstado: vi.fn(async (file) => 'conteudo_' + file),
}));
vi.mock('node:fs', () => ({
    promises: {
        readdir: vi.fn(),
        stat: vi.fn(),
    },
}));
vi.mock('path', async (importOriginal) => {
    const mod = await importOriginal();
    return {
        ...mod,
        join: (...args: string[]) => args.join('/'),
        relative: (from: string, to: string) => to.replace(from + '/', ''),
        dirname: (p: string) => p.split('/').slice(0, -1).join('/') || '/',
    };
});
vi.mock('../nucleo/constelacao/cosmos.js', () => ({
    config: { ZELADOR_IGNORE_PATTERNS: [] },
}));

describe('scanRepository', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('varre diretórios e retorna fileMap com conteúdo', async () => {
        const { promises } = await import('node:fs');
        // Simula estrutura: /base/a.txt, /base/dir/b.js
        (promises.readdir as any)
            .mockImplementationOnce(async () => [fakeDirent('a.txt'), fakeDirent('dir', true)])
            .mockImplementationOnce(async () => [fakeDirent('b.js')]);
        (promises.stat as any)
            .mockImplementation(async (file: string) => ({ mtimeMs: 123, isDirectory: () => file.endsWith('dir'), isSymbolicLink: () => false }));
        const fileMap = await scanRepository('/base');
        // Normaliza os caminhos para garantir compatibilidade cross-plataforma
        const fileKeys = Object.keys(fileMap).map(k => k.replace(/\\/g, '/'));
        expect(fileKeys).toEqual(['a.txt', 'dir/b.js']);
        // Normaliza o conteúdo para garantir compatibilidade cross-plataforma
        const aFile = fileMap['a.txt'];
        // Aceita tanto 'dir/b.js' quanto 'dir\\b.js' como chave
        const bFile = fileMap['dir/b.js'] ?? fileMap['dir\\b.js'];
        expect(aFile).toBeDefined();
        expect(bFile).toBeDefined();
        if (aFile && bFile && aFile.content && bFile.content) {
            expect(aFile.content.replace(/\\/g, '/')).toBe('conteudo_/base/a.txt');
            expect(bFile.content.replace(/\\/g, '/')).toBe('conteudo_/base/dir/b.js');
        }
        expect(fileMap['a.txt'].ultimaModificacao).toBe(123);
    });
});
