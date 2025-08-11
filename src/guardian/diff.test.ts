import { describe, it, expect, vi } from 'vitest';
import { diffSnapshots, verificarErros } from './diff.js';



describe('diffSnapshots', () => {
    it('detecta removidos, adicionados e alterados', () => {
        const before = { a: '1', b: '2', c: '3' };
        const after = { b: '2', c: '4', d: '5' };
        const diff = diffSnapshots(before, after);
        expect(diff.removidos).toEqual(['a']);
        expect(diff.adicionados).toEqual(['d']);
        expect(diff.alterados).toEqual(['c']);
    });
});

describe('verificarErros', () => {
    it('gera mensagens de erro para cada tipo de alteração', async () => {
        vi.resetModules();
        vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
            config: {
                GUARDIAN_ALLOW_DELS: false,
                GUARDIAN_ALLOW_ADDS: false,
                GUARDIAN_ALLOW_CHG: false,
            },
        }));
        const { verificarErros } = await import('./diff.js');
        const diffs1 = {
            removidos: ['a'],
            adicionados: ['d'],
            alterados: ['c'],
        };
        const erros = verificarErros(diffs1);
        expect(erros).toEqual([
            expect.stringContaining('removidos'),
            expect.stringContaining('adicionados'),
            expect.stringContaining('alterados'),
        ]);
    });

    it('não gera erro se permissões permitem tudo', async () => {
        vi.resetModules();
        vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
            config: {
                GUARDIAN_ALLOW_DELS: true,
                GUARDIAN_ALLOW_ADDS: true,
                GUARDIAN_ALLOW_CHG: true,
            },
        }));
        const { verificarErros } = await import('./diff.js');
        const diffs2 = {
            removidos: ['a'],
            adicionados: ['d'],
            alterados: ['c'],
        };
        const erros = verificarErros(diffs2);
        expect(erros).toEqual([]);
    });
});
