import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

let logMock: any;

beforeEach(async () => {
  vi.resetModules();
  logMock = { info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn() };
  vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
  vi.doMock('chalk', () => ({ default: { bold: (x: string) => x } }));
  vi.doMock('../zeladores/util/persistencia.js', () => ({
    salvarEstado: vi.fn(async () => {
      throw new Error('fail-io');
    }),
  }));
});

describe('comandoDiagnosticar scan-only falha export', () => {
  it('registra erro ao exportar relatório scan-only', async () => {
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    const fakeEntries = [
      {
        relPath: 'a.ts',
        fullPath: process.cwd() + '/a.ts',
        content: 'console.log(1);',
        ultimaModificacao: Date.now(),
      },
    ];
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: fakeEntries })),
      prepararComAst: vi.fn(),
      executarInquisicao: vi.fn(),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        GUARDIAN_ENABLED: false,
        GUARDIAN_BASELINE: 'baseline.json',
        ZELADOR_STATE_DIR: '.oraculo',
        VERBOSE: false,
        COMPACT_MODE: false,
        SCAN_ONLY: true,
        REPORT_EXPORT_ENABLED: true,
        REPORT_OUTPUT_DIR: 'out-scan',
      },
    }));
    vi.mock('node:fs', () => ({ promises: { mkdir: vi.fn(async () => undefined) } }));
    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
    program.addCommand(cmd);
    await program.parseAsync(['node', 'cli', 'diagnosticar']);
    expect(logMock.erro).toHaveBeenCalledWith(
      expect.stringContaining('Falha ao exportar relatório de scan-only'),
    );
  });
});
