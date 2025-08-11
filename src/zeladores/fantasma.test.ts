import { describe, it, expect, vi } from 'vitest';
import type { Mock } from 'vitest';
import { detectarFantasmas } from './fantasma.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';

// Mock scanRepository e grafoDependencias para isolar o teste
vi.mock('../nucleo/scanner.js', () => ({
    scanRepository: vi.fn(),
}));
vi.mock('../analistas/detector-dependencias.js', () => ({
    grafoDependencias: new Map(),
}));




describe('detectarFantasmas', () => {
    it('identifica arquivos fantasmas corretamente', async () => {
        const agora = Date.now();
        // Importa o mock do scanRepository
        const { scanRepository } = await import('../nucleo/scanner.js');
        const scanRepoMock = scanRepository as unknown as Mock;
        scanRepoMock.mockResolvedValue({
            'a.ts': { relPath: 'a.ts', fullPath: '/tmp/a.ts' },
            'b.js': { relPath: 'b.js', fullPath: '/tmp/b.js' },
            'c.txt': { relPath: 'c.txt', fullPath: '/tmp/c.txt' }, // não deve entrar
        });
        // Mock fs.stat para datas diferentes
        // @ts-expect-error - ignorar tipagem para mock de stat
        vi.spyOn(fs, 'stat').mockImplementation(async (file) => {
            // Simula objeto Stats mínimo
            const fakeStats = (mtimeMs: number) => ({
                mtimeMs,
                isFile: () => true,
                isDirectory: () => false,
            });
            if (file === '/tmp/a.ts') return fakeStats(agora - 40 * 86_400_000);
            if (file === '/tmp/b.js') return fakeStats(agora - 10 * 86_400_000);
            throw new Error('not found');
        });
        // grafoDependencias vazio (nenhum referenciado)
        const resultado = await detectarFantasmas('/tmp');
        expect(resultado.total).toBe(2);
        expect(resultado.fantasmas).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ arquivo: 'a.ts', referenciado: false }),
                expect.objectContaining({ arquivo: 'b.js', referenciado: false }),
            ]),
        );
    });

    it('ignora arquivos inacessíveis (branch de erro)', async () => {
        const agora = Date.now();
        const { scanRepository } = await import('../nucleo/scanner.js');
        const scanRepoMock = scanRepository as unknown as Mock;
        scanRepoMock.mockResolvedValue({
            'a.ts': { relPath: 'a.ts', fullPath: '/tmp/a.ts' },
            'b.js': { relPath: 'b.js', fullPath: '/tmp/b.js' },
        });
        // Mock fs.stat para lançar erro em um arquivo
        // @ts-expect-error
        vi.spyOn(fs, 'stat').mockImplementation(async (file) => {
            if (file === '/tmp/a.ts') throw new Error('not found');
            return { mtimeMs: agora - 10 * 86_400_000, isFile: () => true, isDirectory: () => false };
        });
        const resultado = await detectarFantasmas('/tmp');
        expect(resultado.fantasmas.some(f => f.arquivo === 'a.ts')).toBe(false);
        expect(resultado.fantasmas.some(f => f.arquivo === 'b.js')).toBe(true);
    });
});
