import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comando-diagnosticar - exportação de relatórios (REPORT_EXPORT_ENABLED)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('ativa export e escreve md/json, sinalizando baselineModificado quando presente', async () => {
    vi.mock('chalk', () => ({ default: { bold: (x: string) => x } }));
    const hoisted = vi.hoisted(() => ({
      iniciarInq: vi.fn(async () => ({ fileEntries: [{ relPath: 'a.ts', fullPath: 'x' }] })),
      prepAst: vi.fn(async (fe: any[]) => fe.map((f) => ({ ...f, ast: {} }))),
      execInq: vi.fn(async () => ({ ocorrencias: [], metricas: undefined })),
      salvarEstadoMock: vi.fn(async () => void 0),
      gerarRelatorioMarkdownMock: vi.fn(async () => void 0),
      sucesso: vi.fn(),
    }));
    vi.mock('../nucleo/constelacao/log.js', () => ({
      log: {
        info: vi.fn(),
        sucesso: hoisted.sucesso,
        aviso: vi.fn(),
        erro: vi.fn(),
        fase: vi.fn(),
      },
    }));
    vi.mock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: hoisted.iniciarInq,
      prepararComAst: hoisted.prepAst,
      executarInquisicao: hoisted.execInq,
      tecnicas: [],
      registrarUltimasMetricas: vi.fn(),
    }));
    vi.mock('../guardian/sentinela.js', () => ({
      scanSystemIntegrity: vi.fn(async () => ({ status: 'ok', baselineModificado: true })),
    }));
    vi.mock('../relatorios/gerador-relatorio.js', () => ({
      gerarRelatorioMarkdown: hoisted.gerarRelatorioMarkdownMock,
    }));
    vi.mock('../zeladores/util/persistencia.js', () => ({
      salvarEstado: hoisted.salvarEstadoMock,
    }));
    vi.mock('node:fs', () => ({ promises: { mkdir: vi.fn(async () => undefined) } }));
    vi.mock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        DEV_MODE: true,
        VERBOSE: false,
        COMPACT_MODE: true,
        GUARDIAN_ENABLED: true,
        GUARDIAN_ENFORCE_PROTECTION: false,
        REPORT_SILENCE_LOGS: false,
        SCAN_ONLY: false,
        REPORT_EXPORT_ENABLED: true,
        REPORT_OUTPUT_DIR: undefined,
      },
    }));

    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));

    await program.parseAsync(['node', 'cli', 'diagnosticar']);

    expect(hoisted.sucesso).toHaveBeenCalledWith(
      expect.stringContaining('Relatórios exportados para'),
    );
  });
});
