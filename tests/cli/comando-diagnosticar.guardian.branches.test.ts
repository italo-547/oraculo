// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comando-diagnosticar - guardian branches (permissive)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('enforce=false: segue permissivo e informa aviso', async () => {
    vi.mock('chalk', () => ({ default: { bold: (x: string) => x } }));
    vi.mock('../../src/nucleo/constelacao/log.js', () => ({
      log: {
        info: vi.fn(),
        sucesso: vi.fn(),
        aviso: vi.fn(),
        erro: vi.fn(),
        debug: vi.fn(),
        fase: vi.fn(),
      },
    }));
    const hoisted2 = vi.hoisted(() => ({
      iniciarInquisicaoMock: vi.fn(async () => ({ fileEntries: [] })),
      prepararComAstMock: vi.fn(async (_fe: any) => []),
      executarInquisicaoMock: vi.fn(async () => ({ ocorrencias: [], metricas: undefined })),
    }));
    vi.mock('../../src/nucleo/inquisidor.js', () => ({
      iniciarInquisicao: hoisted2.iniciarInquisicaoMock,
      prepararComAst: hoisted2.prepararComAstMock,
      executarInquisicao: hoisted2.executarInquisicaoMock,
      tecnicas: [],
      registrarUltimasMetricas: vi.fn(),
    }));
    vi.mock('../../src/guardian/sentinela.js', () => ({
      scanSystemIntegrity: vi.fn(async () => {
        const err: any = new Error('falha');
        throw err;
      }),
    }));
    vi.mock('../../src/nucleo/constelacao/cosmos.js', () => ({
      config: {
        DEV_MODE: true,
        VERBOSE: false,
        COMPACT_MODE: true,
        GUARDIAN_ENABLED: false,
        GUARDIAN_ENFORCE_PROTECTION: false,
        REPORT_SILENCE_LOGS: false,
        SCAN_ONLY: false,
        REPORT_EXPORT_ENABLED: false,
      },
    }));

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as any);
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');

    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    program.addCommand(comandoDiagnosticar(aplicarFlagsGlobais));

    await program.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check']);

    expect(log.aviso).toHaveBeenCalledWith(expect.stringContaining('Modo permissivo'));
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
