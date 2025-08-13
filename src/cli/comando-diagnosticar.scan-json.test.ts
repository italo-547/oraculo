import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

let logMock: any;

beforeEach(async () => {
  vi.resetModules();
  logMock = { info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn() };
  vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
  vi.doMock('chalk', () => ({ default: { bold: (x: string) => x } }));
  vi.doMock('../zeladores/util/persistencia.js', () => ({
    salvarEstado: vi.fn(async () => undefined),
  }));
});

describe('comandoDiagnosticar scan/json branches', () => {
  it('scan-only com exportação + json gera arquivo e saída estruturada', async () => {
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
    const salvarEstadoMod = await import('../zeladores/util/persistencia.js');
    const salvarEstado = vi.mocked(salvarEstadoMod.salvarEstado);
    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
    program.addCommand(cmd);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // Não passamos --scan-only (flag global pertence ao bin), simulamos via config.SCAN_ONLY
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--json']);
    expect(salvarEstado).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('scan-only'));
    consoleSpy.mockRestore();
  });

  it('modo json retorna status erro quando apenas PARSE_ERRO e PARSE_ERRO_FALHA=true', async () => {
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    const fakeEntries = [
      {
        relPath: 'b.ts',
        fullPath: process.cwd() + '/b.ts',
        content: 'console.log(2);',
        ultimaModificacao: Date.now(),
      },
    ];
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: fakeEntries })),
      prepararComAst: vi.fn(async (entries: any) => {
        (globalThis as any).__ORACULO_PARSE_ERROS__ = [
          { tipo: 'PARSE_ERRO', mensagem: 'fail parse', relPath: 'b.ts' },
        ];
        (globalThis as any).__ORACULO_PARSE_ERROS_ORIGINAIS__ = 2;
        return entries.map((e: any) => ({ ...e, ast: undefined }));
      }),
      executarInquisicao: vi.fn(async () => ({ ocorrencias: [], fileEntries: fakeEntries })),
      tecnicas: [],
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        GUARDIAN_ENABLED: false,
        GUARDIAN_BASELINE: 'baseline.json',
        ZELADOR_STATE_DIR: '.oraculo',
        VERBOSE: false,
        COMPACT_MODE: false,
        SCAN_ONLY: false,
        PARSE_ERRO_FALHA: true,
        REPORT_EXPORT_ENABLED: false,
      },
    }));
    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
    program.addCommand(cmd);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--json']);
    const saida = consoleSpy.mock.calls.at(-1)?.[0];
    const parsed = JSON.parse(saida);
    expect(parsed.status).toBe('erro');
    expect(parsed.parseErros.totalOriginais).toBe(2);
    expect(parsed.parseErros.totalExibidos).toBe(1);
    consoleSpy.mockRestore();
  });
});
