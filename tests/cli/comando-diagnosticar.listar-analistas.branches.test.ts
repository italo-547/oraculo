// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';

// Evita exits durante os testes
process.env.VITEST = '1';

// Mock do núcleo de inquisição para evitar IO pesado
vi.mock('../../src/nucleo/inquisidor.js', () => ({
  iniciarInquisicao: async () => ({ fileEntries: [] }),
  prepararComAst: async (files: any[]) => files,
  executarInquisicao: async () => ({ ocorrencias: [], metricas: undefined }),
  registrarUltimasMetricas: vi.fn(),
  tecnicas: [],
}));

// Mock de registry exportando listarAnalistas (para o comando) e registroAnalistas (usado em inquisidor)
vi.mock('../../src/analistas/registry.js', () => ({
  listarAnalistas: () => [
    { nome: 'TecnicaAlpha', categoria: 'analista', descricao: 'A' },
    { nome: 'TecnicaBeta', categoria: 'tecnica', descricao: 'B' },
  ],
  registroAnalistas: [],
}));

// Mock de log para capturar impressão de bloco
const imprimirBloco = vi.fn();
vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: {
    calcularLargura: () => 84,
    imprimirBloco,
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

beforeEach(() => {
  imprimirBloco.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function buildCLI() {
  // Força modo scan-only e desliga export para retorno rápido
  const cosmos = await import('../../src/nucleo/constelacao/cosmos.js');
  cosmos.config.SCAN_ONLY = true;
  cosmos.config.REPORT_EXPORT_ENABLED = false;
  const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
  const program = new Command();
  program.addCommand(comandoDiagnosticar(() => {}));
  return program;
}

describe('comando diagnosticar --listar-analistas', () => {
  it('exibe bloco com técnicas ativas usando imprimirBloco', async () => {
    const cli = await buildCLI();
    await cli.parseAsync(['node', 'cli', 'diagnosticar', '--listar-analistas']);
    expect(imprimirBloco).toHaveBeenCalled();
    const [titulo, linhas] = imprimirBloco.mock.calls[0];
    expect(String(titulo)).toMatch(/Técnicas ativas/);
    const joined = (linhas as string[]).join('\n');
    expect(joined).toMatch(/Nome/);
    expect(joined).toMatch(/TecnicaAlpha/);
    expect(joined).toMatch(/TecnicaBeta/);
  });
});
