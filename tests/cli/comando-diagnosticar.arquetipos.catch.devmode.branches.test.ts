// SPDX-License-Identifier: MIT
import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks na ordem correta (mais específicos primeiro)
const erroSpy = vi.fn((message) => {
  console.log('DEBUG: erroSpy called with:', message);
  return message;
});

// Mock do log primeiro
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

// Mock do cosmos - movido para cima e com configuração mais explícita
vi.mock('../../src/nucleo/constelacao/cosmos.js', () => {
  const mockConfig = {
    DEV_MODE: true,
    VERBOSE: true,
    COMPACT_MODE: false,
    SCAN_ONLY: false,
    REPORT_EXPORT_ENABLED: false,
    PARSE_ERRO_FALHA: false,
    GUARDIAN_BASELINE: '.oraculo/baseline.json',
    ZELADOR_STATE_DIR: '.oraculo',
  };
  return {
    config: mockConfig,
  };
});

// Mock do detectarArquetipos (deve ser o último para garantir que seja aplicado)
vi.mock('../../src/analistas/detector-arquetipos.js', () => ({
  detectarArquetipos: vi.fn(async () => {
    console.log('DEBUG: detectarArquetipos mock called, throwing error immediately');
    throw new Error('falha no detector');
  }),
}));

// Mocks restantes
vi.mock('../../src/nucleo/inquisidor.js', () => ({
  iniciarInquisicao: async () => ({ fileEntries: [{ relPath: 'a.ts', conteudo: '' }] }),
  prepararComAst: async (fe: any[]) => fe,
  executarInquisicao: async () => ({ ocorrencias: [], metricas: undefined }),
  registrarUltimasMetricas: vi.fn(),
  tecnicas: [],
}));

vi.mock('../../src/guardian/sentinela.js', () => ({
  scanSystemIntegrity: vi.fn(async () => ({ status: 'ok' })),
}));

vi.mock('../../src/arquitetos/diagnostico-projeto.js', () => ({
  diagnosticarProjeto: vi.fn(() => undefined),
}));

beforeEach(() => {
  // vi.resetModules(); // Temporariamente removido para debug
  erroSpy.mockClear();
});

describe('comando-diagnosticar – arquetipos catch DEV_MODE', () => {
  it('quando detectarArquetipos lança e DEV_MODE=true, loga erro no catch', async () => {
    // Forçar execução do detectarArquetipos definindo variável de ambiente
    process.env.FORCAR_DETECT_ARQUETIPOS = 'true';

    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const { config } = await import('../../src/nucleo/constelacao/cosmos.js');

    // Garante que DEV_MODE está definido
    config.DEV_MODE = true;

    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    program.addCommand(comandoDiagnosticar(aplicarFlagsGlobais));

    await program.parseAsync(['node', 'cli', 'diagnosticar']);

    const erros = erroSpy.mock.calls.map((c) => String(c[0])).join('\n');

    expect(erros).toMatch(/Falha detector arquetipos:/);
  }, 15000);
});
