// SPDX-License-Identifier: MIT
import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks mínimos para passar pelo fluxo
vi.mock('../../src/nucleo/inquisidor.js', () => ({
  iniciarInquisicao: async () => ({ fileEntries: [] }),
  prepararComAst: async () => [],
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

const infoSpy = vi.fn();
vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: {
    info: infoSpy,
    sucesso: vi.fn(),
    aviso: vi.fn(),
    erro: vi.fn(),
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
  infoSpy.mockClear();
});

describe('comando-diagnosticar – filtros verbose include com barra', () => {
  it('expande diretório com barra sem criar variante **/x/** e loga filtros', async () => {
    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const { config } = await import('../../src/nucleo/constelacao/cosmos.js');
    config.VERBOSE = true;

    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    program.addCommand(comandoDiagnosticar(aplicarFlagsGlobais));

    await program.parseAsync([
      'node',
      'cli',
      'diagnosticar',
      '--verbose',
      '--include',
      'src/utils',
    ]);

    // Deve ter expandido para ['src/utils', 'src/utils/**'] mas não '**/src/utils/**'
    expect(config.CLI_INCLUDE_PATTERNS).toContain('src/utils');
    expect(config.CLI_INCLUDE_PATTERNS).toContain('src/utils/**');
    expect(config.CLI_INCLUDE_PATTERNS).not.toContain('**/src/utils/**');

    const out = infoSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(out).toMatch(/Filtros ativos:/);
    expect(out).toMatch(/include=\[/);
  }, 15000);
});
