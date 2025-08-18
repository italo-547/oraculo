// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

// Cobre branch: VERBOSE ativo mas sem include/exclude -> NÃO imprime "Filtros ativos"

describe('comando-diagnosticar – VERBOSE sem filtros (branches)', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1';
  });

  it('não imprime bloco de filtros quando não há include/exclude mesmo com --verbose', async () => {
    const logMock = {
      info: vi.fn(),
      sucesso: vi.fn(),
      aviso: vi.fn(),
      erro: vi.fn(),
      fase: vi.fn(),
      imprimirBloco: vi.fn(),
      calcularLargura: vi.fn(() => 80),
    } as any;
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.doMock('chalk', () => ({
      default: {
        bold: (x: string) => x,
        cyan: { bold: (x: string) => x },
        green: { bold: (x: string) => x },
      },
    }));

    const cfg = {
      DEV_MODE: false,
      GUARDIAN_ENABLED: false,
      VERBOSE: false, // será ligado pela flag
      COMPACT_MODE: true,
      REPORT_SILENCE_LOGS: false,
      SCAN_ONLY: false,
      REPORT_EXPORT_ENABLED: false,
      PARSE_ERRO_FALHA: false,
      ZELADOR_IGNORE_PATTERNS: ['**/node_modules/**'],
      GUARDIAN_IGNORE_PATTERNS: ['**/node_modules/**'],
      GUARDIAN_BASELINE: 'guardian-baseline.json',
      ZELADOR_STATE_DIR: '.oraculo',
    } as any;
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({ config: cfg }));

    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
      prepararComAst: vi.fn(async () => []),
      executarInquisicao: vi.fn(async () => ({
        ocorrencias: [],
        metricas: { analistas: [], totalArquivos: 0, tempoAnaliseMs: 0, tempoParsingMs: 0 },
      })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));

    vi.doMock('../analistas/detector-arquetipos.js', () => ({
      detectarArquetipos: vi.fn(async () => ({ melhores: [] })),
    }));
    vi.doMock('../arquitetos/analista-estrutura.js', () => ({
      alinhamentoEstrutural: vi.fn(async () => []),
    }));
    vi.doMock('../arquitetos/diagnostico-projeto.js', () => ({ diagnosticarProjeto: vi.fn() }));
    vi.doMock('../relatorios/relatorio-estrutura.js', () => ({ gerarRelatorioEstrutura: vi.fn() }));
    vi.doMock('../relatorios/relatorio-zelador-saude.js', () => ({
      exibirRelatorioZeladorSaude: vi.fn(),
    }));
    vi.doMock('../relatorios/relatorio-padroes-uso.js', () => ({
      exibirRelatorioPadroesUso: vi.fn(),
    }));
    vi.doMock('../relatorios/conselheiro-oracular.js', () => ({ emitirConselhoOracular: vi.fn() }));

    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--compact', '--verbose']);

    const logs = logMock.info.mock.calls.map((c: any[]) => String(c[0]));
    expect(logs.some((l: string) => /Filtros ativos/.test(l))).toBe(false);
  });
});
