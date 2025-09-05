// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';

// Salva/restaura VITEST para controlar blocos específicos
const ORIGINAL_VITEST = process.env.VITEST;

// Mocks para evitar trabalho pesado no fluxo
const infoDestaque = vi.fn();

// Mock do log deve ser definido ANTES de qualquer import
vi.mock('../../src/nucleo/constelacao/log.js', () => {
  const mockLog = {
    calcularLargura: () => 84,
    imprimirBloco: vi.fn((titulo: string, linhas: string[]) => {
      console.log('DEBUG imprimirBloco chamado:', titulo);
    }),
    info: vi.fn(),
    aviso: vi.fn(),
    erro: vi.fn(),
    infoDestaque,
  };

  return {
    log: mockLog,
  };
});

vi.mock('../../src/nucleo/inquisidor.js', () => ({
  iniciarInquisicao: async () => ({ fileEntries: [] }),
  prepararComAst: async (files: any[]) => files,
  executarInquisicao: async () => ({
    ocorrencias: [
      { tipo: 'PARSE_ERRO', nivel: 'erro', mensagem: 'x', relPath: 'a.ts', linha: 1 },
      { tipo: 'TODO_PENDENTE', nivel: 'aviso', mensagem: 'todo', relPath: 'a.ts', linha: 2 },
    ],
    metricas: undefined,
  }),
  registrarUltimasMetricas: vi.fn(),
  tecnicas: [],
}));

vi.mock('../../src/analistas/detector-arquetipos.js', () => ({
  detectarArquetipos: async () => undefined,
}));

beforeEach(() => {
  // vi.resetModules(); // Removido para não interferir com o mock
  infoDestaque.mockClear();
});

afterEach(() => {
  if (ORIGINAL_VITEST !== undefined) process.env.VITEST = ORIGINAL_VITEST;
  else delete (process.env as any).VITEST;
  // vi.restoreAllMocks(); // Removido temporariamente para debug
  vi.clearAllMocks();
});

async function buildCLI(compact = true) {
  const cosmos = await import('../../src/nucleo/constelacao/cosmos.js');
  cosmos.config.SCAN_ONLY = false;
  cosmos.config.REPORT_EXPORT_ENABLED = false;
  cosmos.config.COMPACT_MODE = compact;
  cosmos.config.VERBOSE = false;
  const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
  const program = new Command();
  program.addCommand(comandoDiagnosticar(() => {}));

  // Cria spy diretamente no log
  const logModule = await import('../../src/nucleo/constelacao/log.js');
  const imprimirBlocoSpy = vi.spyOn(logModule.log, 'imprimirBloco');

  return { program, imprimirBlocoSpy };
}

describe('comando diagnosticar – resumo e despedida', () => {
  it('quando há problemas: imprime resumo e/ou bloco de despedida (fora de VITEST)', async () => {
    // Criar spy ANTES de remover VITEST para garantir que seja interceptado
    const spyExit = vi.spyOn(process, 'exit').mockImplementation((() => {
      console.log('DEBUG: process.exit foi chamado!');
      return undefined;
    }) as any);

    // Desliga VITEST para acionar bloco de despedida; evita sair do processo
    delete (process.env as any).VITEST;

    console.log('DEBUG: Antes de executar CLI, VITEST removido');
    const { program: cli, imprimirBlocoSpy } = await buildCLI(true);
    console.log('DEBUG: CLI construído, executando parseAsync');
    await cli.parseAsync(['node', 'cli', 'diagnosticar']);
    console.log('DEBUG: parseAsync concluído');

    console.log('DEBUG: Após execução, imprimirBlocoSpy.mock.calls:', imprimirBlocoSpy.mock.calls);
    console.log(
      'DEBUG: Após execução, imprimirBlocoSpy.mock.calls.length:',
      imprimirBlocoSpy.mock.calls.length,
    );
    // Deve ter impresso algum bloco moldurado (independente do título específico)
    expect(imprimirBlocoSpy).toHaveBeenCalled();

    // No fluxo normal (não SCAN_ONLY, não JSON, não erro), o process.exit NÃO é chamado
    // O código apenas retorna o resultado sem encerrar o processo
    console.log('DEBUG: spyExit.mock.calls:', spyExit.mock.calls);
    console.log('DEBUG: spyExit.mock.calls.length:', spyExit.mock.calls.length);

    // O comportamento correto é NÃO chamar process.exit no fluxo normal
    expect(spyExit).not.toHaveBeenCalled();
    spyExit.mockRestore();
  });
});
