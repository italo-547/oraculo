import { describe, it, expect, vi } from 'vitest';
import { verificarRegistros } from './verificador.js';

vi.mock('./hash.js', () => ({
    gerarSnapshotDoConteudo: vi.fn((c: string) => 'hash_' + c),
}));

describe('verificarRegistros', () => {
    it('detecta arquivos corrompidos corretamente', () => {
        const fileEntries = [
            { relPath: 'a', content: 'abc', fullPath: '/tmp/a' },
            { relPath: 'b', content: 'def', fullPath: '/tmp/b' },
        ];
        const registrosSalvos = [
            { arquivo: 'a', hash: 'hash_abc' },
            { arquivo: 'b', hash: 'hash_X' },
        ];
        const resultado = verificarRegistros(fileEntries, registrosSalvos);
        expect(resultado.corrompidos).toEqual(['b']);
        expect(resultado.verificados).toBe(2);
    });

    it('ignora arquivos sem conteúdo', () => {
        const fileEntries = [
            { relPath: 'a', content: '', fullPath: '/tmp/a' },
            { relPath: 'b', content: 'def', fullPath: '/tmp/b' },
        ];
        const registrosSalvos = [
            { arquivo: 'a', hash: 'hash_abc' },
            { arquivo: 'b', hash: 'hash_def' },
        ];
        const resultado = verificarRegistros(fileEntries, registrosSalvos);
        expect(resultado.corrompidos).toEqual([]);
        expect(resultado.verificados).toBe(2);
    });
});
