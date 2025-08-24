// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comando-diagnosticar — bloco VERBOSE de anomalias e drift sem baseline (usa "desconhecido")', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('imprime bloco de anomalias e linhas de drift com baseNome "desconhecido" quando baseline ausente', async () => {
    const hoisted = vi.hoisted(() => ({
      logMock: {
        info: vi.fn(),
        aviso: vi.fn(),
        erro: vi.fn(),
        sucesso: vi.fn(),
        calcularLargura: () => 84,
        imprimirBloco: vi.fn(),
      } as any,
    }));
    vi.mock('../../src/nucleo/constelacao/log.js', () => ({ log: hoisted.logMock }));
    vi.mock('../../src/nucleo/constelacao/cosmos.js', () => ({
      config: {
        VERBOSE: true,
        COMPACT_MODE: false,
        REPORT_EXPORT_ENABLED: false,
        SCAN_ONLY: false,
        DEV_MODE: false,
        GUARDIAN_BASELINE: 'guardian-baseline.json',
        ZELADOR_STATE_DIR: 'inc-state',
      },
    }));
    vi.mock('../../src/nucleo/inquisidor.js', () => ({
      iniciarInquisicao: async () => ({ fileEntries: [{ relPath: 'a.ts', content: 'x' }] }),
      prepararComAst: async (f: any) => f,
      executarInquisicao: async () => ({ ocorrencias: [], metricas: undefined }),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    // detector sem baseline, com drift e candidato com anomalias > 8 para cobrir aviso de ocultas
    vi.mock('../../src/analistas/detector-arquetipos.js', () => ({
      detectarArquetipos: async () => ({
        melhores: [
          {
            nome: 'mono',
            confidence: 0.9,
            score: 42,
            anomalias: Array.from({ length: 10 }).map((_, i) => ({
              path: `p${i}.ts`,
              motivo: 'm',
            })),
            planoSugestao: { mover: [] },
          },
        ],
        baseline: undefined,
        drift: {
          alterouArquetipo: false,
          anterior: 'a',
          atual: 'a',
          deltaConfidence: 0.12,
          arquivosRaizNovos: [],
          arquivosRaizRemovidos: [],
        },
      }),
    }));
    // Outras dependências no caminho não-JSON e não-compacto
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

    const program = new Command();
    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    program.addCommand(comandoDiagnosticar(() => {}));

    await program.parseAsync(['node', 'cli', 'diagnosticar', '--verbose']);

    // Deve ter impresso bloco de anomalias (imprimirBloco chamado com título contendo "Anomalias")
    expect(
      hoisted.logMock.imprimirBloco.mock.calls.some((c: any[]) =>
        String(c[0]).includes('Anomalias'),
      ),
    ).toBe(true);
    // Deve registrar aviso de ocultas (+2) e uma linha de drift contendo "desconhecido"
    expect(
      hoisted.logMock.aviso.mock.calls.some((c: any[]) => String(c[0]).includes('ocultas')),
    ).toBe(true);
    expect(
      hoisted.logMock.aviso.mock.calls.some((c: any[]) => String(c[0]).includes('desconhecido')),
    ).toBe(true);
  });
});
