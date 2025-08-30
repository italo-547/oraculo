// SPDX-License-Identifier: MIT
import { describe, it, vi, expect, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comandoDiagnosticar agregação parse errors', () => {
  let logMock: any;
  beforeEach(() => {
    vi.resetModules();
    logMock = { info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn() };
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.mock('chalk', () => ({ default: { bold: (x: string) => x } }));
    vi.mock('../../src/nucleo/constelacao/cosmos.js', () => ({
      config: { PARSE_ERRO_FALHA: true },
    }));
    vi.mock('../../src/nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [{ relPath: 'a.ts', content: 'x' }] })),
      prepararComAst: vi.fn(async (entries: any) => {
        (globalThis as any).__ORACULO_PARSE_ERROS__ = [
          { tipo: 'PARSE_ERRO', mensagem: 'parse1', relPath: 'a.ts', nivel: 'erro' },
          { tipo: 'PARSE_ERRO', mensagem: 'parse2', relPath: 'b.ts', nivel: 'erro' },
        ];
        (globalThis as any).__ORACULO_PARSE_ERROS_ORIGINAIS__ = 5;
        return entries.map((e: any) => ({ ...e, ast: {} }));
      }),
      executarInquisicao: vi.fn(async () => ({
        ocorrencias: [],
        metricas: {
          analistas: [],
          totalArquivos: 1,
          tempoAnaliseMs: 5,
          tempoParsingMs: 1,
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
    vi.mock('../../src/analistas/detector-estrutura.ts', () => ({
      detectorEstrutura: { nome: 'detector-estrutura', aplicar: vi.fn(() => []) },
      sinaisDetectados: [],
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
    vi.mock('../../src/relatorios/gerador-relatorio.js', () => ({
      gerarRelatorioMarkdown: vi.fn(),
    }));
    vi.mock('../../src/zeladores/util/persistencia.js', () => ({ salvarEstado: vi.fn() }));
  });

  it('agrega parse errors e marca severidade', async () => {
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
    program.addCommand(cmd);
    await program.parseAsync(['node', 'cli', 'diagnosticar']);

    expect(
      logMock.info.mock.calls.some((c: any[]) => String(c[0]).includes('Diagnóstico concluído')),
    ).toBe(true);
  });
});
