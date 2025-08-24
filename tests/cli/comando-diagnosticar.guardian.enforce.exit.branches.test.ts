// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';

const ORIGINAL_VITEST = process.env.VITEST;

describe('comando-diagnosticar — guardian enforce com detalhes e exit em caminho coberto', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    if (ORIGINAL_VITEST !== undefined) process.env.VITEST = ORIGINAL_VITEST;
    else delete (process.env as any).VITEST;
    vi.restoreAllMocks();
  });

  it('quando GUARDIAN_ENFORCE_PROTECTION e erro com detalhes, chama log.aviso para cada detalhe', async () => {
    // Força comportamento próximo ao runtime (para percorrer ramo do process.exit guardado pelo VITEST)
    process.env.VITEST = '1';

    const hoisted = vi.hoisted(() => ({
      logMock: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn() } as any,
    }));
    vi.mock('../../src/nucleo/constelacao/log.js', () => ({ log: hoisted.logMock }));
    vi.mock('../../src/nucleo/constelacao/cosmos.js', () => ({
      config: {
        GUARDIAN_ENABLED: true,
        GUARDIAN_ENFORCE_PROTECTION: true,
        VERBOSE: false,
        COMPACT_MODE: false,
        REPORT_EXPORT_ENABLED: false,
        SCAN_ONLY: false,
        DEV_MODE: false,
        GUARDIAN_BASELINE: 'guardian-baseline.json',
        ZELADOR_STATE_DIR: 'inc-state',
      },
    }));

    // scanSystemIntegrity lança erro com detalhes
    vi.mock('../../src/guardian/sentinela.js', () => ({
      scanSystemIntegrity: vi.fn(async () => {
        const err: any = new Error('blocked');
        err.detalhes = ['det1', 'det2'];
        throw err;
      }),
    }));

    // Inquisidor mínimo para continuar fluxo até guardian
    vi.mock('../../src/nucleo/inquisidor.js', () => ({
      iniciarInquisicao: async () => ({ fileEntries: [{ relPath: 'x.ts', content: 'x' }] }),
      prepararComAst: async (files: any) => files,
      executarInquisicao: async () => ({ ocorrencias: [], metricas: undefined }),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));

    const program = new Command();
    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    program.addCommand(comandoDiagnosticar(() => {}));

    await program.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check']);

    expect(hoisted.logMock.erro).toHaveBeenCalled();
    expect(hoisted.logMock.aviso).toHaveBeenCalledWith(expect.stringContaining('det1'));
    expect(hoisted.logMock.aviso).toHaveBeenCalledWith(expect.stringContaining('det2'));
  });
});
