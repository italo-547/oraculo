// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

// Exercita branches de comando-diagnosticar em modo --compact para
// cobrir logging compacto de arquétipos e caminho sem baseline drift relevante.

describe('comandoDiagnosticar modo compacto arquetipos', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1';
  });

  it('lista arquétipos em modo compacto (COMPACT_MODE) com formatação reduzida', async () => {
    const logMock = { info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn() };
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.doMock('chalk', () => ({ default: { bold: (x: string) => x, dim: (x: string) => x } }));
    // Config inicial com COMPACT_MODE = false (será setado pela flag) e silencios desligados
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        GUARDIAN_ENABLED: false,
        VERBOSE: false,
        COMPACT_MODE: false,
        REPORT_SILENCE_LOGS: false,
        SCAN_ONLY: false,
        REPORT_EXPORT_ENABLED: false,
        GUARDIAN_BASELINE: '.oraculo/guardian-baseline.json',
        ZELADOR_STATE_DIR: '.oraculo',
      },
    }));
    // Inquisição mínima
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({
        fileEntries: [{ relPath: 'src/a.ts', content: 'a' }],
      })),
      prepararComAst: vi.fn(async (fes: any) => fes.map((f: any) => ({ ...f, ast: {} }))),
      executarInquisicao: vi.fn(async () => ({
        ocorrencias: [],
        metricas: {
          analistas: [],
          totalArquivos: 1,
          tempoAnaliseMs: 1,
          tempoParsingMs: 1,
          cacheAstHits: 0,
          cacheAstMiss: 0,
        },
        fileEntries: [],
      })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    // Detector de arquétipos retornando múltiplos candidatos para forçar logging compacto
    vi.doMock('../analistas/detector-arquetipos.js', () => ({
      detectarArquetipos: vi.fn(async () => ({
        melhores: [
          {
            nome: 'cli-modular',
            confidence: 92,
            score: 180,
            missingRequired: [],
            matchedRequired: ['src'],
            forbiddenPresent: [],
            anomalias: [],
            planoSugestao: {
              mover: [],
              conflitos: [],
              resumo: { total: 0, zonaVerde: 0, bloqueados: 0 },
            },
          },
          {
            nome: 'bot',
            confidence: 90,
            score: 170,
            missingRequired: [],
            matchedRequired: ['src'],
            forbiddenPresent: [],
            anomalias: [],
            planoSugestao: {
              mover: [],
              conflitos: [],
              resumo: { total: 0, zonaVerde: 0, bloqueados: 0 },
            },
          },
        ],
        baseline: undefined,
        drift: undefined,
      })),
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
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--compact']);

    const infoJoined = logMock.info.mock.calls.map((c) => c[0]).join('\n');
    // Aceita variações de linha compacta
    const matcher = /arquétipos:|arquétipos/i;
    if (!matcher.test(infoJoined)) {
      console.log('INFO DEBUG:', infoJoined);
    }
    expect(infoJoined).toMatch(matcher);
  });
});
