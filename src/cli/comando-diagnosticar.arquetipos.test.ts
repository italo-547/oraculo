import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comandoDiagnosticar arquetipos & drift', () => {
  let logMock: any;
  beforeEach(() => {
    vi.resetModules();
    logMock = { info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn() };
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.mock('chalk', () => ({ default: { bold: (x: string) => x, dim: (x: string) => x } }));
    vi.mock('../nucleo/constelacao/cosmos.js', () => ({ config: {} }));
    vi.mock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({
        fileEntries: [{ relPath: 'a.ts', content: 'const x=1;' }],
      })),
      prepararComAst: vi.fn(async (entries: any) => entries.map((e: any) => ({ ...e, ast: {} }))),
      executarInquisicao: vi.fn(async () => ({
        ocorrencias: [],
        metricas: {
          analistas: [],
          totalArquivos: 1,
          tempoAnaliseMs: 10,
          tempoParsingMs: 5,
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
            nome: 'monorepo',
            confidence: 0.87,
            score: 123,
            missingRequired: ['packages'],
            matchedRequired: ['src'],
            forbiddenPresent: ['.env'],
            anomalias: Array.from({ length: 10 }).map((_, i) => ({
              path: `file${i}.ts`,
              motivo: 'motivo',
            })),
            planoSugestao: {
              mover: [
                { de: 'a.ts', para: 'src/a.ts' },
                { de: 'b.ts', para: 'src/b.ts' },
                { de: 'c.ts', para: 'src/c.ts' },
                { de: 'd.ts', para: 'src/d.ts' },
              ],
              conflitos: ['c.ts'],
            },
          },
        ],
        baseline: { arquetipo: 'monorepo', confidence: 0.8, timestamp: Date.now() },
        drift: {
          alterouArquetipo: false,
          deltaConfidence: 0.07,
          arquivosRaizNovos: ['novo.md'],
          arquivosRaizRemovidos: ['velho.md'],
        },
      })),
    }));
  });

  it('cobre logs detalhados de arquetipos e drift em modo verbose', async () => {
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const { config } = await import('../nucleo/constelacao/cosmos.js');
    config.VERBOSE = true;
    config.COMPACT_MODE = false;
    const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
    program.addCommand(cmd);
    await program.parseAsync(['node', 'cli', 'diagnosticar']);
    expect(
      logMock.info.mock.calls.some((c: any[]) => String(c[0]).includes('Arquétipos candidatos')),
    ).toBe(true);
    expect(logMock.aviso.mock.calls.some((c: any[]) => String(c[0]).includes('drift:'))).toBe(true);
  });
});
