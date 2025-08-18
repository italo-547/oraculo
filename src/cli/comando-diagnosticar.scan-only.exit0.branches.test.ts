// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';

const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  vi.resetModules();
  saved.VITEST = process.env.VITEST;
  delete (process.env as any).VITEST;
});

afterEach(() => {
  if (saved.VITEST === undefined) delete (process.env as any).VITEST;
  else process.env.VITEST = saved.VITEST;
});

describe('comando-diagnosticar — scan-only exit(0) fora de testes', () => {
  it('encerra com exit(0) quando SCAN_ONLY=true e não é json', async () => {
    const aplicar = vi.fn();
    const log: any = { info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn() };
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log }));
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [{ relPath: 'a' }] })),
      prepararComAst: vi.fn(),
      executarInquisicao: vi.fn(),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        DEV_MODE: true,
        VERBOSE: false,
        COMPACT_MODE: true,
        SCAN_ONLY: true,
        REPORT_EXPORT_ENABLED: false,
        GUARDIAN_ENABLED: false,
        GUARDIAN_BASELINE: 'baseline.json',
        ZELADOR_STATE_DIR: '.oraculo',
      },
    }));

    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(aplicar));

    // Espia process.exit sem lançar, para não cair no catch global e virar exit(1)
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      return undefined as never;
    }) as any);

    await program.parseAsync(['node', 'cli', 'diagnosticar']);
    expect(exitSpy).toHaveBeenCalledWith(0);
    exitSpy.mockRestore();
  });
});
