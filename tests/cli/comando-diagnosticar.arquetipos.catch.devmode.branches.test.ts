// SPDX-License-Identifier: MIT
import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Força falha no detector de arquétipos para entrar no catch
vi.mock('../../src/analistas/detector-arquetipos.js', () => ({
  detectarArquetipos: vi.fn(async () => {
    throw new Error('falha no detector');
  }),
}));

// Mocks mínimos
vi.mock('../../src/nucleo/inquisidor.js', () => ({
  iniciarInquisicao: async () => ({ fileEntries: [{ relPath: 'a.ts', conteudo: '' }] }),
  prepararComAst: async (fe: any[]) => fe,
  executarInquisicao: async () => ({ ocorrencias: [], metricas: undefined }),
  registrarUltimasMetricas: vi.fn(),
  tecnicas: [],
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
vi.mock('../../src/arquitetos/diagnostico-projeto.js', () => ({ diagnosticarProjeto: vi.fn() }));
vi.mock('../../src/relatorios/gerador-relatorio.js', () => ({ gerarRelatorioMarkdown: vi.fn() }));

const erroSpy = vi.fn();
vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: {
    info: vi.fn(),
    erro: erroSpy,
    aviso: vi.fn(),
    sucesso: vi.fn(),
    imprimirBloco: vi.fn(),
    simbolos: {
      info: 'ℹ️',
      sucesso: '✅',
      erro: '❌',
      aviso: '⚠️',
      debug: '🐞',
      fase: '🔶',
      passo: '▫️',
      scan: '🔍',
      guardian: '🛡️',
      pasta: '📂',
    },
  },
}));

beforeEach(() => {
  vi.resetModules();
  erroSpy.mockClear();
});

describe('comando-diagnosticar – arquetipos catch DEV_MODE', () => {
  it('quando detectarArquetipos lança e DEV_MODE=true, loga erro no catch', async () => {
    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const { config } = await import('../../src/nucleo/constelacao/cosmos.js');
    config.DEV_MODE = true;

    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    program.addCommand(comandoDiagnosticar(aplicarFlagsGlobais));

    await program.parseAsync(['node', 'cli', 'diagnosticar']);

    const erros = erroSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(erros).toMatch(/Falha detector arquetipos:/);
  }, 15000);
});
