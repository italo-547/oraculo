// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';

const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  vi.resetModules();
  saved.VITEST = process.env.VITEST;
  delete (process.env as any).VITEST; // simula runtime
});

afterEach(() => {
  if (saved.VITEST === undefined) delete (process.env as any).VITEST;
  else process.env.VITEST = saved.VITEST;
});

describe('comando-diagnosticar — guardian enforce chama exit(1)', () => {
  it('quando scanSystemIntegrity lança com detalhes e ENFORCE=true', async () => {
    const aplicar = vi.fn();
    const log: any = {
      info: vi.fn(),
      sucesso: vi.fn(),
      aviso: vi.fn(),
      erro: vi.fn(),
      fase: vi.fn(),
    };
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log }));
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [{ relPath: 'a' }] })),
      prepararComAst: vi.fn(async (e: any) => e),
      executarInquisicao: vi.fn(async () => ({ ocorrencias: [] })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    vi.doMock('../guardian/sentinela.js', () => ({
      scanSystemIntegrity: vi.fn(async () => {
        const e: any = new Error('blk');
        e.detalhes = ['d1', 'd2'];
        throw e;
      }),
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        DEV_MODE: true,
        VERBOSE: false,
        COMPACT_MODE: true,
        SCAN_ONLY: false,
        REPORT_EXPORT_ENABLED: false,
        GUARDIAN_ENABLED: true,
        GUARDIAN_ENFORCE_PROTECTION: true,
      },
    }));

    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(aplicar));

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error('exit:' + code);
    }) as any);

    try {
      await program.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check']);
      expect(true).toBe(false); // não deve chegar aqui
    } catch (e: any) {
      expect(e.message).toBe('exit:1');
    } finally {
      exitSpy.mockRestore();
    }
  });
});
