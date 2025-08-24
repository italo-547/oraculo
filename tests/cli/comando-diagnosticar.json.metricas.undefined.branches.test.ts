// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

// Cobre branch: modo --json quando executarInquisicao não retorna metricas -> metricas: undefined no JSON

describe('comando-diagnosticar – JSON metricas undefined (branches)', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1';
  });

  it('emite JSON com metricas=undefined quando executor não fornece metricas', async () => {
    const logMock = { info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn() } as any;
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));

    const cfg = {
      DEV_MODE: false,
      GUARDIAN_ENABLED: false,
      VERBOSE: false,
      COMPACT_MODE: true,
      REPORT_SILENCE_LOGS: false,
      SCAN_ONLY: false,
      REPORT_EXPORT_ENABLED: false,
      PARSE_ERRO_FALHA: false,
      GUARDIAN_BASELINE: 'guardian-baseline.json',
      ZELADOR_STATE_DIR: '.oraculo',
    } as any;
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({ config: cfg }));

    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [{ relPath: 'a.ts', content: 'x' }] })),
      prepararComAst: vi.fn(async (fes: any) => fes.map((f: any) => ({ ...f, ast: {} }))),
      executarInquisicao: vi.fn(async () => ({ ocorrencias: [] })), // sem metricas
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));

    vi.doMock('chalk', () => ({ default: { bold: (x: string) => x } }));

    const logs: string[] = [];
    const origLog = console.log;
    console.log = (msg?: any) => {
      if (typeof msg === 'string') logs.push(msg);
    };

    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--json']);

    console.log = origLog;

    const out = JSON.parse(logs.join('\n'));
    expect(out.metricas).toBeUndefined();
  });
});
