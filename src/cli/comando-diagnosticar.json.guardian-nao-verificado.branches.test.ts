import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comandoDiagnosticar --json guardian = nao-verificado quando não rodado', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('preenche guardian como nao-verificado quando GUARDIAN_ENABLED=false', async () => {
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();

        const fakeEntries = [
            { relPath: 'a.ts', fullPath: process.cwd() + '/a.ts', content: 'console.log(1);' },
        ];

        vi.doMock('../nucleo/inquisidor.js', () => ({
            iniciarInquisicao: vi.fn(async () => ({ fileEntries: fakeEntries })),
            prepararComAst: vi.fn(async (entries: any) => entries.map((e: any) => ({ ...e, ast: null }))),
            executarInquisicao: vi.fn(async () => ({ ocorrencias: [], fileEntries: fakeEntries })),
            registrarUltimasMetricas: vi.fn(),
            tecnicas: [],
        }));

        vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
            config: {
                GUARDIAN_ENABLED: false,
                GUARDIAN_BASELINE: 'baseline.json',
                ZELADOR_STATE_DIR: '.oraculo',
                ZELADOR_IGNORE_PATTERNS: ['node_modules/**'],
                GUARDIAN_IGNORE_PATTERNS: ['node_modules/**'],
                VERBOSE: false,
                COMPACT_MODE: false,
                SCAN_ONLY: false,
                REPORT_EXPORT_ENABLED: false,
            },
        }));

        vi.doMock('../nucleo/constelacao/log.js', () => ({ log: { info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn() } }));
        vi.doMock('chalk', () => ({ default: { bold: (x: string) => x, cyan: { bold: (x: string) => x } } }));

        const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
        const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
        program.addCommand(cmd);

        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
        await program.parseAsync(['node', 'cli', 'diagnosticar', '--json']);
        const saida = consoleSpy.mock.calls.at(-1)?.[0] as string;
        const parsed = JSON.parse(saida);
        expect(parsed.guardian).toBe('nao-verificado');
        consoleSpy.mockRestore();
    });
});
