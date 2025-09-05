// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comandoPodar branches adicionais', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('acumula include/exclude via options, expande includes e remove ignore de node_modules', async () => {
    vi.mock('chalk', () => ({ default: { bold: (x: string) => x, yellow: (x: string) => x } }));
    vi.mock('../../src/nucleo/constelacao/log.js', () => ({
      log: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn() },
    }));
    vi.mock('../../src/nucleo/constelacao/cosmos.js', () => ({
      config: {
        CLI_INCLUDE_PATTERNS: [] as string[],
        CLI_EXCLUDE_PATTERNS: [] as string[],
        ZELADOR_IGNORE_PATTERNS: ['node_modules/**', 'dist/**'],
        GUARDIAN_IGNORE_PATTERNS: ['node_modules/**', 'coverage/**'],
      },
    }));
    vi.mock('../../src/nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
    }));
    const hoisted = vi.hoisted(() => ({
      removerArquivosOrfaosMock: vi.fn(async () => ({
        arquivosOrfaos: [{ arquivo: 'a.tmp', referenciado: false, diasInativo: 1 }],
      })),
    }));
    vi.mock('../../src/zeladores/poda.js', () => ({
      removerArquivosOrfaos: hoisted.removerArquivosOrfaosMock,
    }));

    const { comandoPodar } = await import('../../src/cli/comando-podar.js');
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    const { config } = await import('../../src/nucleo/constelacao/cosmos.js');
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    program.addCommand(comandoPodar(aplicarFlagsGlobais));

    await program.parseAsync([
      'node',
      'cli',
      'podar',
      '--include',
      'src,docs',
      '--include',
      'node_modules',
      '--exclude',
      'dist,coverage ',
      '--force',
    ]);

    // Patterns configurados
    expect(config.CLI_INCLUDE_PATTERNS.length).toBeGreaterThan(0);
    expect(config.CLI_EXCLUDE_PATTERNS).toEqual(expect.arrayContaining(['dist', 'coverage']));
    // Incluiu node_modules -> remove de ignores
    expect(config.ZELADOR_IGNORE_PATTERNS.some((p: string) => /node_modules/.test(p))).toBe(false);
    expect(config.GUARDIAN_IGNORE_PATTERNS.some((p: string) => /node_modules/.test(p))).toBe(false);

    // Teve órfãos e como --force, removeu diretamente e sucesso foi logado
    expect(hoisted.removerArquivosOrfaosMock).toHaveBeenCalledTimes(2); // listar + remover
    expect(log.sucesso).toHaveBeenCalledWith(
      expect.stringContaining('Arquivos órfãos removidos com sucesso'),
    );
  });
});
