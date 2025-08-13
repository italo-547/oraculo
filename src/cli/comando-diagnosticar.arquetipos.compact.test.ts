import { describe, it, vi, expect, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comandoDiagnosticar arquetipos modo compacto', () => {
  let logMock: any;
  beforeEach(() => {
    vi.resetModules();
    logMock = { info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn() };
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.mock('chalk', () => ({ default: { bold: (x: string) => x } }));
    vi.mock('../nucleo/constelacao/cosmos.js', () => ({ config: {} }));
    vi.mock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [{ relPath: 'a.ts', content: 'x' }] })),
      prepararComAst: vi.fn(async (entries: any) => entries.map((e: any) => ({ ...e, ast: {} }))),
      executarInquisicao: vi.fn(async () => ({
        ocorrencias: [],
        metricas: {
          analistas: [],
          totalArquivos: 1,
          tempoAnaliseMs: 5,
          tempoParsingMs: 2,
          cacheAstHits: 0,
          cacheAstMiss: 0,
        },
        fileEntries: [],
      })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    vi.mock('../guardian/sentinela.js', () => ({
      scanSystemIntegrity: vi.fn(async () => ({ status: 'ok' })),
    }));
    vi.mock('../arquitetos/analista-estrutura.js', () => ({
      alinhamentoEstrutural: vi.fn(() => []),
    }));
    vi.mock('../arquitetos/diagnostico-projeto.js', () => ({
      diagnosticarProjeto: vi.fn(() => ({})),
    }));
    vi.mock('../analistas/detector-estrutura.js', () => ({ sinaisDetectados: [] }));
    vi.mock('../relatorios/relatorio-estrutura.js', () => ({ gerarRelatorioEstrutura: vi.fn() }));
    vi.mock('../relatorios/relatorio-zelador-saude.js', () => ({
      exibirRelatorioZeladorSaude: vi.fn(),
    }));
    vi.mock('../relatorios/relatorio-padroes-uso.js', () => ({
      exibirRelatorioPadroesUso: vi.fn(),
    }));
    vi.mock('../relatorios/conselheiro-oracular.js', () => ({ emitirConselhoOracular: vi.fn() }));
    vi.mock('../relatorios/gerador-relatorio.js', () => ({ gerarRelatorioMarkdown: vi.fn() }));
    vi.mock('../zeladores/util/persistencia.js', () => ({ salvarEstado: vi.fn() }));
    vi.mock('../analistas/detector-arquetipos.js', () => ({
      detectarArquetipos: vi.fn(async () => ({
        melhores: [
          {
            nome: 'mono',
            confidence: 0.8,
            score: 10,
            missingRequired: [],
            matchedRequired: ['src'],
            forbiddenPresent: [],
            anomalias: [],
            planoSugestao: { mover: [] },
          },
          {
            nome: 'lib',
            confidence: 0.6,
            score: 8,
            missingRequired: [],
            matchedRequired: ['src'],
            forbiddenPresent: [],
            anomalias: [],
            planoSugestao: { mover: [] },
          },
        ],
        baseline: null,
        drift: null,
      })),
    }));
  });

  it('lista arquétipos em linha compacta', async () => {
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const { config } = await import('../nucleo/constelacao/cosmos.js');
    config.COMPACT_MODE = true;
    config.VERBOSE = false;
    const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
    program.addCommand(cmd);
    await program.parseAsync(['node', 'cli', 'diagnosticar']);
    const found = logMock.info.mock.calls.some((c: any[]) => /arqu[eé]tipos/i.test(String(c[0])));
    // Em modo compacto a linha pode não conter ':' dependendo de formatação – apenas assegura presença da palavra
    expect(found).toBe(true);
  });
});
