// SPDX-License-Identifier: MIT
// Mock de config deve ser o primeiro!
vi.mock('../../src/config', () => ({
  GUARDIAN_BASELINE: 'mock-baseline.json',
  GUARDIAN_REGISTROS: 'mock-registros.json',
  GUARDIAN_SNAPSHOT: 'mock-snapshot.json',
  GUARDIAN_MODE: 'permissivo',
}));

import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';

// Isolado para não poluir outros testes
vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: {
    info: vi.fn(),
    sucesso: vi.fn(),
    aviso: vi.fn(),
    erro: vi.fn(),
  },
}));
vi.mock('chalk', () => ({ default: { bold: (x: string) => x } }));
vi.mock('../../src/nucleo/constelacao/cosmos.js', () => ({
  config: {
    GUARDIAN_BASELINE: 'mock-baseline.json',
    GUARDIAN_REGISTROS: 'mock-registros.json',
    GUARDIAN_SNAPSHOT: 'mock-snapshot.json',
    GUARDIAN_MODE: 'permissivo',
  },
}));
// Mock de constantes sem spread
vi.mock('../../src/guardian/constantes', () => ({
  BASELINE_PATH: 'mock-baseline-path',
  REGISTROS_PATH: 'mock-registros-path',
}));
vi.mock('../../src/nucleo/inquisidor.js', () => ({
  iniciarInquisicao: vi.fn(async () => {
    throw 'erro string simples';
  }),
  executarInquisicao: vi.fn(async () => ({ ocorrencias: [], fileEntries: [] })),
  registrarUltimasMetricas: vi.fn(),
  tecnicas: [],
}));

import { comandoDiagnosticar } from '../../src/cli/comando-diagnosticar.js';

describe('comandoDiagnosticar (erro string isolado)', () => {
  it('executa diagnóstico e lida com erro fatal (catch) com erro string', async () => {
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
    program.addCommand(cmd);
    await program.parseAsync(['node', 'cli', 'diagnosticar']);
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    expect(log.erro).toHaveBeenCalledWith(expect.stringContaining('erro string simples'));
    exitSpy.mockRestore();
  });
});
