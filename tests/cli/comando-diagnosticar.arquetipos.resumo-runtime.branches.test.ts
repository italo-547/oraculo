// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';

const ORIGINAL_VITEST = process.env.VITEST;

describe('comando-diagnosticar arquetipos – resumo moldurado fora de teste', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    if (ORIGINAL_VITEST !== undefined) process.env.VITEST = ORIGINAL_VITEST;
    else delete (process.env as any).VITEST;
    vi.restoreAllMocks();
  });

  it('imprime bloco de resumo de estrutura quando há baseline/drift (fora de VITEST)', async () => {
    // Força ambiente runtime humano
    delete (process.env as any).VITEST;

    // Mock log com imprimirBloco (definido dentro da factory para evitar hoist issues)
    vi.mock('../../src/nucleo/constelacao/log.js', () => {
      const mock = {
        calcularLargura: () => 84,
        imprimirBloco: vi.fn(),
        info: vi.fn(),
        aviso: vi.fn(),
        sucesso: vi.fn(),
        infoDestaque: vi.fn(),
      } as any;
      return { log: mock };
    });

    // Mock inquisidor: retorna sem ocorrências para simplificar
    vi.mock('../../src/nucleo/inquisidor.js', () => ({
      iniciarInquisicao: async () => ({ fileEntries: [{ relPath: 'a.ts', content: 'x' }] }),
      prepararComAst: async (files: any[]) => files,
      executarInquisicao: async () => ({ ocorrencias: [], metricas: undefined }),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));

    // Evita import de log precoce via guardian/sentinela
    vi.mock('../../src/guardian/sentinela.js', () => ({
      scanSystemIntegrity: vi.fn(async () => ({ status: 'ok' })),
    }));
    // Mock detector de arquétipos com baseline e drift
    vi.mock('../../src/analistas/detector-arquetipos.js', () => ({
      detectarArquetipos: async () => ({
        candidatos: [
          { nome: 'mono', confidence: 0.9, score: 10, anomalias: [], planoSugestao: { mover: [] } },
        ],
        baseline: { arquetipo: 'mono', confidence: 0.9, timestamp: Date.now() },
        drift: {
          alterouArquetipo: false,
          anterior: 'mono',
          atual: 'mono',
          deltaConfidence: 0.1,
          arquivosRaizNovos: ['src/new.ts'],
          arquivosRaizRemovidos: [],
        },
      }),
    }));

    // Mocks extras chamados no fluxo não-JSON quando não-compacto
    vi.mock('../../src/arquitetos/analista-estrutura.js', () => ({
      alinhamentoEstrutural: vi.fn(() => []),
    }));
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

    const cosmos = await import('../../src/nucleo/constelacao/cosmos.js');
    cosmos.config.SCAN_ONLY = false;
    cosmos.config.REPORT_EXPORT_ENABLED = false;
    cosmos.config.COMPACT_MODE = false;
    cosmos.config.VERBOSE = false;

    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as any);
    await program.parseAsync(['node', 'cli', 'diagnosticar']);

    // Deve ter sido chamado um bloco com título de resumo (Resumo da estrutura ou Resumo rápido)
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    const calls = (log as any).imprimirBloco.mock.calls;
    const debug = calls
      .map((c: any[]) => ({ titulo: c[0], linhas: c[1] }))
      .map((o) => JSON.stringify(o))
      .join('\n');
    const matcher = /Resumo|Diagnóstico|Estrutura|mono|drift|baseline|estrutura/i;
    const found = calls.some((c: any[]) => matcher.test(String(c[0])));
    if (!found) {
      console.log('BLOCOS DEBUG:', debug);
    }
    expect(found).toBe(true);
    exitSpy.mockRestore();
  });
});
