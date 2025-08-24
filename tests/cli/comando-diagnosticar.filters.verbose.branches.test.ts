// SPDX-License-Identifier: MIT
import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks leves para evitar execução pesada
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
vi.mock('../../src/analistas/detector-arquetipos.js', () => ({
  detectarArquetipos: async () => ({ melhores: [] }),
}));

// Mock de log para capturar mensagens de filtro
const infoSpy = vi.fn();
const avisoSpy = vi.fn();
const sucessoSpy = vi.fn();
const erroSpy = vi.fn();
const infoDestaqueSpy = vi.fn();
const faseSpy = vi.fn();
const imprimirBlocoSpy = vi.fn();
vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: {
    info: infoSpy,
    aviso: avisoSpy,
    sucesso: sucessoSpy,
    erro: erroSpy,
    infoDestaque: infoDestaqueSpy,
    fase: faseSpy,
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
  infoSpy.mockClear();
  avisoSpy.mockClear();
  sucessoSpy.mockClear();
  erroSpy.mockClear();
  infoDestaqueSpy.mockClear();
  faseSpy.mockClear();
  imprimirBlocoSpy.mockClear();
});

describe('comando-diagnosticar – filtros verbose e expansão de includes', () => {
  it('em --verbose loga filtros ativos e inclui nota de node_modules; inclui expande diretório simples', async () => {
    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const { config } = await import('../../src/nucleo/constelacao/cosmos.js');

    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    program.addCommand(comandoDiagnosticar(aplicarFlagsGlobais));

    await program.parseAsync([
      'node',
      'cli',
      'diagnosticar',
      '--verbose',
      '--include',
      'src', // sem meta → deve expandir
      '--include',
      'node_modules', // sem meta → ainda detecta node_modules
      '--exclude',
      'docs',
    ]);

    // Verifica log de filtros ativos com nota sobre node_modules
    const msg =
      infoSpy.mock.calls.map((c) => String(c[0])).find((m) => m.includes('Filtros ativos')) || '';
    expect(msg).toContain('include=[');
    expect(msg).toContain('exclude=[');
    expect(msg).toContain('node_modules incluído');

    // Verifica expansão do include simples
    const patterns = config.CLI_INCLUDE_PATTERNS || [];
    expect(patterns).toEqual(
      expect.arrayContaining([
        'src',
        'src/**',
        '**/src/**',
        'node_modules',
        'node_modules/**',
        '**/node_modules/**',
      ]),
    );
  }, 15000);
});
