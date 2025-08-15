import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';

// Salva/restaura VITEST para controlar blocos específicos
const ORIGINAL_VITEST = process.env.VITEST;

// Mocks para evitar trabalho pesado no fluxo
const imprimirBloco = vi.fn();
const infoDestaque = vi.fn();
vi.mock('../nucleo/constelacao/log.js', () => ({
  log: {
    calcularLargura: () => 84,
    imprimirBloco,
    info: vi.fn(),
    aviso: vi.fn(),
    erro: vi.fn(),
    infoDestaque,
  },
}));

vi.mock('../nucleo/inquisidor.js', () => ({
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

vi.mock('../analistas/detector-arquetipos.js', () => ({
  detectarArquetipos: async () => undefined,
}));

beforeEach(() => {
  vi.resetModules();
  imprimirBloco.mockClear();
  infoDestaque.mockClear();
});

afterEach(() => {
  if (ORIGINAL_VITEST !== undefined) process.env.VITEST = ORIGINAL_VITEST;
  else delete (process.env as any).VITEST;
  vi.restoreAllMocks();
});

async function buildCLI(compact = true) {
  const cosmos = await import('../nucleo/constelacao/cosmos.js');
  cosmos.config.SCAN_ONLY = false;
  cosmos.config.REPORT_EXPORT_ENABLED = false;
  cosmos.config.COMPACT_MODE = compact;
  cosmos.config.VERBOSE = false;
  const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
  const program = new Command();
  program.addCommand(comandoDiagnosticar(() => {}));
  return program;
}

describe('comando diagnosticar – resumo e despedida', () => {
  it('quando há problemas: imprime resumo e/ou bloco de despedida (fora de VITEST)', async () => {
    // Desliga VITEST para acionar bloco de despedida; evita sair do processo
    delete (process.env as any).VITEST;
    const spyExit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as any);
    const cli = await buildCLI(true);
    await cli.parseAsync(['node', 'cli', 'diagnosticar']);
    // Deve ter impresso algum bloco moldurado (independente do título específico)
    expect(imprimirBloco.mock.calls.length).toBeGreaterThan(0);
    // Não deve encerrar o teste (o CLI chamaria exit fora do VITEST; aqui interceptamos)
    expect(spyExit).toHaveBeenCalled();
    spyExit.mockRestore();
  });
});
