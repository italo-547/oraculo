// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comandoDiagnosticar – captura de erro fatal', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1';
  });

  it('quando iniciarInquisicao lança erro, bloco catch registra log.erro', async () => {
    const logMock = { info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn() } as any;
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.doMock('chalk', () => ({ default: { bold: (x: string) => x } }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        GUARDIAN_ENABLED: false,
        GUARDIAN_ENFORCE_PROTECTION: false,
        VERBOSE: false,
        COMPACT_MODE: false,
        REPORT_SILENCE_LOGS: false,
        SCAN_ONLY: false,
        REPORT_EXPORT_ENABLED: false,
        PARSE_ERRO_FALHA: false,
        // Necessários por src/guardian/constantes.ts
        GUARDIAN_BASELINE: '.oraculo/baseline.json',
        ZELADOR_STATE_DIR: '.oraculo',
      },
    }));
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => {
        throw new Error('boom');
      }),
      prepararComAst: vi.fn(),
      executarInquisicao: vi.fn(),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));

    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));
    await program.parseAsync(['node', 'cli', 'diagnosticar']);

    const erroJoined = logMock.erro.mock.calls.map((c: any[]) => c[0]).join('\n');
    expect(erroJoined).toMatch(/Erro fatal durante o diagnóstico/);
  });
});
