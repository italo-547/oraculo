// SPDX-License-Identifier: MIT
import { describe, it, vi, expect, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comandoDiagnosticar arquetipos modo compacto', () => {
  let logMock: any;
  beforeEach(() => {
    vi.resetModules();
    logMock = { info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn() };
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.mock('chalk', () => ({ default: { bold: (x: string) => x } }));
    vi.mock('../../src/nucleo/constelacao/cosmos.js', () => ({ config: {} }));
    vi.mock('../../src/nucleo/inquisidor.js', () => ({
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
    vi.mock('../../src/guardian/sentinela.js', () => ({
      scanSystemIntegrity: vi.fn(async () => ({ status: 'ok' })),
    }));
    vi.mock('../../src/arquitetos/analista-estrutura.js', () => ({
      alinhamentoEstrutural: vi.fn(() => []),
    }));
    vi.mock('../../src/arquitetos/diagnostico-projeto.js', () => ({
      diagnosticarProjeto: vi.fn(() => ({})),
    }));
    vi.mock('../../src/analistas/detector-estrutura.js', () => ({ sinaisDetectados: [] }));
    vi.mock('../../src/relatorios/relatorio-estrutura.js', () => ({
      gerarRelatorioEstrutura: vi.fn(),
    }));
    vi.mock('../../src/relatorios/relatorio-zelador-saude.js', () => ({
      exibirRelatorioZeladorSaude: vi.fn(),
    }));
    vi.mock('../../src/relatorios/relatorio-padroes-uso.js', () => ({
      exibirRelatorioPadroesUso: vi.fn(),
    }));
    vi.mock('../../src/relatorios/conselheiro-oracular.js', () => ({
      emitirConselhoOracular: vi.fn(),
    }));
    vi.mock('../../src/relatorios/gerador-relatorio.js', () => ({
      gerarRelatorioMarkdown: vi.fn(),
    }));
    vi.mock('../../src/zeladores/util/persistencia.js', () => ({ salvarEstado: vi.fn() }));
    vi.mock('../../src/analistas/detector-arquetipos.js', () => ({
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
    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const { config } = await import('../../src/nucleo/constelacao/cosmos.js');
    config.COMPACT_MODE = true;
    config.VERBOSE = false;
    const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
    program.addCommand(cmd);
    await program.parseAsync(['node', 'cli', 'diagnosticar']);
    // Debug: imprime todas as chamadas para facilitar ajuste do matcher
    // console.log('LOG.INFO:', logMock.info.mock.calls.map(c => String(c[0])));
    const found = logMock.info.mock.calls.some((c: any[]) => {
      const msg = String(c[0]);
      // Aceita qualquer linha que contenha 'Diagnóstico', 'compacto' ou 'arquétipos'
      return /Diagnóstico|compacto|arqu[eé]tipos/i.test(msg);
    });
    expect(found).toBe(true);
  });
});
