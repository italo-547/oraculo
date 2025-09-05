// SPDX-License-Identifier: MIT
import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock scanSystemIntegrity para lançar erro sem detalhes → branch permissivo
vi.mock('../../src/guardian/sentinela.js', () => ({
  scanSystemIntegrity: async () => {
    const err: any = new Error('falhou guardian sem detalhes');
    // sem err.detalhes → cai no modo permissivo
    throw err;
  },
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

// log para capturar aviso permissivo
const avisoSpy = vi.fn();
const erroSpy = vi.fn();
const infoSpy = vi.fn();
const imprimirBlocoSpy = vi.fn();
vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: {
    info: infoSpy,
    aviso: avisoSpy,
    erro: erroSpy,
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
  avisoSpy.mockClear();
  erroSpy.mockClear();
  infoSpy.mockClear();
  imprimirBlocoSpy.mockClear();
});

describe('comando-diagnosticar – guardian catch permissivo', () => {
  it('quando GUARDIAN_ENABLED e scan lança erro sem detalhes, loga aviso permissivo e segue', async () => {
    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    await import('../../src/nucleo/constelacao/cosmos.js');

    const program = new Command();
    const aplicarFlagsGlobais = vi.fn((opts) => {
      // aplica GUARDIAN_ENABLED via flag --guardian-check
      return opts;
    });
    program.addCommand(comandoDiagnosticar(aplicarFlagsGlobais));

    await program.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check']);

    // Deve ter log de erro do guardian e aviso permissivo
    const avisos = avisoSpy.mock.calls.map((c) => String(c[0])).join('\n');
    const erros = erroSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(erros).toContain('Guardian bloqueou');
    expect(avisos).toContain('Modo permissivo: prosseguindo sob risco.');
  }, 30000);
});
