// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

// Cobre branch: __infoDestaque utiliza fallback em log.info quando log.infoDestaque não existe

describe('comando-diagnosticar – infoDestaque fallback (branches)', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1';
  });

  it('usa log.info quando infoDestaque está ausente', async () => {
    const logMock = {
      info: vi.fn(),
      sucesso: vi.fn(),
      aviso: vi.fn(),
      erro: vi.fn(),
      fase: vi.fn(),
      imprimirBloco: vi.fn(),
      calcularLargura: vi.fn(() => 84),
    } as any;
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));

    vi.doMock('chalk', () => ({
      default: { bold: (x: string) => x, cyan: { bold: (x: string) => x } },
    }));

    const cfg = {
      DEV_MODE: false,
      GUARDIAN_ENABLED: false,
      VERBOSE: false,
      COMPACT_MODE: false, // para entrar no fluxo de cabeçalho completo
      REPORT_SILENCE_LOGS: false,
      SCAN_ONLY: false,
      REPORT_EXPORT_ENABLED: false,
      PARSE_ERRO_FALHA: false,
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

    // Força candidatos de arquétipos para exercer __infoDestaque
    vi.doMock('../analistas/detector-arquetipos.js', () => ({
      detectarArquetipos: vi.fn(async () => ({
        candidatos: [
          {
            nome: 'cli-modular',
            confidence: 0.73,
            score: 100,
            anomalias: [],
            missingRequired: ['src'],
            matchedRequired: [],
            forbiddenPresent: [],
            planoSugestao: {
              mover: [],
              conflitos: [],
              resumo: { total: 0, zonaVerde: 0, bloqueados: 0 },
            },
          },
        ],
        baseline: {
          version: 1,
          timestamp: new Date().toISOString(),
          arquetipo: 'cli-modular',
          confidence: 73,
          arquivosRaiz: [],
        },
        drift: {
          alterouArquetipo: false,
          anterior: 'cli-modular',
          atual: 'cli-modular',
          deltaConfidence: -73,
          arquivosRaizNovos: [],
          arquivosRaizRemovidos: [],
        },
      })),
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

    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));
    await program.parseAsync(['node', 'cli', 'diagnosticar']);

    const infos = logMock.info.mock.calls.map((c: any[]) => String(c[0]));
    const matcher = /Arquétipos candidatos|arquétipos|candidatos/i;
    if (!infos.some((l: string) => matcher.test(l))) {
      console.log('INFO DEBUG:', infos);
    }
    expect(infos.some((l: string) => matcher.test(l))).toBe(true);
  });
});
