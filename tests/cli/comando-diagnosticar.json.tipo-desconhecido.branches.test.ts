// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

beforeEach(() => {
  vi.resetModules();
});

describe('comando-diagnosticar — json: tipo desconhecido agregado', () => {
  it('atribui ocorrencia sem tipo a "desconhecido"', async () => {
    const aplicar = vi.fn();
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [{ relPath: 'a' }] })),
      prepararComAst: vi.fn(async (e: any) => e),
      executarInquisicao: vi.fn(async () => ({ ocorrencias: [{ relPath: 'a', mensagem: 'm' }] })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    vi.doMock('../analistas/detector-arquetipos.js', () => ({
      detectarArquetipos: vi.fn(async () => undefined),
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        DEV_MODE: true,
        VERBOSE: false,
        COMPACT_MODE: true,
        SCAN_ONLY: false,
        REPORT_EXPORT_ENABLED: false,
        GUARDIAN_ENABLED: false,
        GUARDIAN_BASELINE: 'baseline.json',
        ZELADOR_STATE_DIR: '.oraculo',
      },
    }));
    const log = { info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn() } as any;
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log }));

    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(aplicar));
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--json']);
    const out = spy.mock.calls.at(-1)?.[0] as string;
    const parsed = JSON.parse(out);
    expect(parsed.tiposOcorrencias.desconhecido).toBe(1);
    spy.mockRestore();
  });
});
