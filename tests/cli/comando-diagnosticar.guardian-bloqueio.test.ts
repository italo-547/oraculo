// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

// Cobre branch de bloqueio do Guardian com GUARDIAN_ENFORCE_PROTECTION ativado, erro com detalhes

describe('comandoDiagnosticar guardian bloqueio', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1';
  });

  it('loga detalhes quando Guardian bloqueia com proteção forçada (exit suprimido em VITEST)', async () => {
    const logMock = { info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn() };
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.doMock('chalk', () => ({ default: { bold: (x: string) => x } }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        GUARDIAN_ENABLED: true,
        GUARDIAN_ENFORCE_PROTECTION: true,
        VERBOSE: false,
        COMPACT_MODE: false,
        REPORT_SILENCE_LOGS: false,
        SCAN_ONLY: false,
        REPORT_EXPORT_ENABLED: false,
        PARSE_ERRO_FALHA: false,
        GUARDIAN_BASELINE: '.oraculo/guardian-baseline.json',
        ZELADOR_STATE_DIR: '.oraculo',
      },
    }));
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [{ relPath: 'a.ts', content: 'x' }] })),
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
    const erroGuardian: any = new Error('bloqueado');
    erroGuardian.detalhes = ['det1', 'det2'];
    vi.doMock('../guardian/sentinela.js', () => ({
      scanSystemIntegrity: vi.fn(async () => {
        throw erroGuardian;
      }),
    }));
    vi.doMock('../analistas/detector-estrutura.ts', () => ({ sinaisDetectados: [] }));
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
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check']);

    const erroCalls = logMock.erro.mock.calls.map((c) => c[0]).join('\n');
    expect(erroCalls).toMatch(/Guardian bloqueou/);
    const avisoJoined = logMock.aviso.mock.calls.map((c) => c[0]).join('\n');
    expect(avisoJoined).toMatch(/det1/);
    expect(avisoJoined).toMatch(/det2/);
    // Não deve ter mensagem de modo permissivo
    expect(avisoJoined).not.toMatch(/Modo permissivo/);
  });
});
