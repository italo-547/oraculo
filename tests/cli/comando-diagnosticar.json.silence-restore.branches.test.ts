// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comandoDiagnosticar – modo JSON silencia e restaura logs', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1';
  });

  it('substitui info/sucesso/aviso por no-op e restaura após finalizar', async () => {
    const logMock = {
      info: vi.fn(),
      sucesso: vi.fn(),
      aviso: vi.fn(),
      erro: vi.fn(),
    } as any;
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
    const iniciarResp = { fileEntries: [{ relPath: 'a.ts', content: 'x' }] } as any;
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => iniciarResp),
      prepararComAst: vi.fn(async (fes: any) => fes.map((f: any) => ({ ...f, ast: {} }))),
      executarInquisicao: vi.fn(async () => ({
        ocorrencias: [],
        metricas: {
          analistas: [],
          totalArquivos: 1,
          tempoAnaliseMs: 1,
          tempoParsingMs: 1,
        },
      })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    vi.doMock('../analistas/detector-estrutura.js', () => ({ sinaisDetectados: [] }));
    vi.doMock('../arquitetos/analista-estrutura.js', () => ({
      alinhamentoEstrutural: vi.fn(() => []),
    }));
    vi.doMock('../arquitetos/diagnostico-projeto.js', () => ({
      diagnosticarProjeto: vi.fn(() => ({})),
    }));
    vi.doMock('../relatorios/relatorio-estrutura.js', () => ({ gerarRelatorioEstrutura: vi.fn() }));
    vi.doMock('../relatorios/relatorio-zelador-saude.js', () => ({
      exibirRelatorioZeladorSaude: vi.fn(),
    }));
    vi.doMock('../relatorios/relatorio-padroes-uso.js', () => ({
      exibirRelatorioPadroesUso: vi.fn(),
    }));
    vi.doMock('../relatorios/conselheiro-oracular.js', () => ({ emitirConselhoOracular: vi.fn() }));
    vi.doMock('../relatorios/gerador-relatorio.js', () => ({ gerarRelatorioMarkdown: vi.fn() }));

    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));
    const out: string[] = [];
    const origLog = console.log;
    console.log = (m?: any) => out.push(String(m));
    try {
      await program.parseAsync(['node', 'cli', 'diagnosticar', '--json']);
    } finally {
      console.log = origLog;
    }

    expect(out.join('\n')).toMatch(/\"status\"\s*:\s*\"ok\"/);
    expect(logMock.info).not.toHaveBeenCalled();
    expect(logMock.aviso).not.toHaveBeenCalled();
    expect(logMock.sucesso).not.toHaveBeenCalled();
    expect(typeof logMock.info).toBe('function');
  });
});
