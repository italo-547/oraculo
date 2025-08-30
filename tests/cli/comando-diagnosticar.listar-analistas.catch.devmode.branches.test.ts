// SPDX-License-Identifier: MIT
import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Força falha ao importar registry
vi.mock('../../src/analistas/registry.js', () => {
  throw new Error('falha simulada importar registry');
});

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

// log com debug capturável
const debugSpy = vi.fn();
const infoSpy = vi.fn();
const imprimirBlocoSpy = vi.fn();
const erroSpy = vi.fn();
const avisoSpy = vi.fn();
const sucessoSpy = vi.fn();
vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: {
    info: infoSpy,
    debug: debugSpy,
    erro: erroSpy,
    aviso: avisoSpy,
    sucesso: sucessoSpy,
    imprimirBloco: imprimirBlocoSpy,
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
  debugSpy.mockClear();
  infoSpy.mockClear();
  imprimirBlocoSpy.mockClear();
  erroSpy.mockClear();
  avisoSpy.mockClear();
  sucessoSpy.mockClear();
});

describe('comando-diagnosticar – listar-analistas catch em DEV_MODE', () => {
  it('quando registry falha e DEV_MODE=true, loga debug no catch', async () => {
    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const { config } = await import('../../src/nucleo/constelacao/cosmos.js');
    config.DEV_MODE = true;

    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    program.addCommand(comandoDiagnosticar(aplicarFlagsGlobais));

    await program.parseAsync(['node', 'cli', 'diagnosticar', '--listar-analistas']);

    const dbg = debugSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(dbg).toContain('Falha ao listar analistas:');
  }, 30000);
});
