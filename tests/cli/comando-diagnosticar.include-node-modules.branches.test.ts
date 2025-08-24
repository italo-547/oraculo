// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

// Evita exits durante os testes
process.env.VITEST = '1';

// Mocks mínimos do pipeline de inquisição
vi.mock('../../src/nucleo/inquisidor.js', () => ({
  iniciarInquisicao: vi.fn(async () => ({ fileEntries: [], tempoMs: 1 })),
  prepararComAst: vi.fn(async () => []),
  executarInquisicao: vi.fn(async () => ({ ocorrencias: [], fileEntries: [] })),
  registrarUltimasMetricas: vi.fn(),
  tecnicas: [],
}));

// Mock log para capturar mensagens de filtros
const info = vi.fn();
vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: { info, sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn(), debug: vi.fn() },
}));

async function buildCLI() {
  const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
  const program = new Command();
  // habilita VERBOSE via flags locais do comando
  program.addCommand(comandoDiagnosticar(() => {}));
  return program;
}

describe('comando diagnosticar include/exclude e node_modules', () => {
  it('expande include simples e indica inclusão de node_modules em VERBOSE', async () => {
    const cli = await buildCLI();
    await cli.parseAsync([
      'node',
      'cli',
      'diagnosticar',
      '--verbose',
      '--include',
      'node_modules',
      '--exclude',
      'dist',
    ]);
    const joined = info.mock.calls.map((c) => String(c[0])).join('\n');
    expect(joined).toMatch(/Filtros ativos:/);
    expect(joined).toMatch(/include=\[/);
    expect(joined).toMatch(/exclude=\[/);
    expect(joined).toMatch(/node_modules incluído/);
  });
});
