// SPDX-License-Identifier: MIT
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { Command } from 'commander';

const ORIG_ENV: Record<string, string | undefined> = { ...process.env } as any;

describe('comandoDiagnosticar – JSON exits (branches)', () => {
  beforeEach(() => {
    vi.resetModules();
    // Força ambiente não-test para cobrir branches de exit
    delete (process.env as any).VITEST;
  });
  afterEach(() => {
    vi.restoreAllMocks();
    for (const k of Object.keys(process.env)) delete (process.env as any)[k];
    for (const [k, v] of Object.entries(ORIG_ENV)) if (v !== undefined) (process.env as any)[k] = v;
  });

  it('em modo --json chama process.exit(0) quando ok e process.exit(1) quando temErro', async () => {
    // Primeiro run: OK (sem ocorrências)
    vi.resetModules();

    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
      prepararComAst: vi.fn(async (fes: any) => fes),
      executarInquisicao: vi.fn(async () => ({
        ocorrencias: [],
        metricas: {},
      })),
      registrarUltimasMetricas: vi.fn(() => ({})),
      tecnicas: [],
    }));

    vi.doMock('../guardian/sentinela.js', () => ({
      scanSystemIntegrity: vi.fn(async () => ({ status: 'ok' })),
    }));

    vi.doMock('../arquitetos/diagnostico-projeto.js', () => ({
      diagnosticarProjeto: vi.fn(() => undefined),
    }));

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });

    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));

    try {
      await program.parseAsync(['node', 'cli', 'diagnosticar', '--json']);
    } catch (e) {
      // Espera erro de exit
      expect(e.message).toBe('exit');
    }

    expect(exitSpy).toHaveBeenCalledWith(0);
    exitSpy.mockRestore();
  });
});
