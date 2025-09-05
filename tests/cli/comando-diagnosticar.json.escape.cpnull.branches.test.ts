// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';

describe('comandoDiagnosticar --json escapeNonAscii: caminho cp==null', () => {
  const original = (String.prototype as any).codePointAt;
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    (String.prototype as any).codePointAt = original;
  });

  it('quando codePointAt retorna null, substitui por string vazia no escape', async () => {
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();

    const fakeEntries = [
      { relPath: 'x.ts', fullPath: process.cwd() + '/x.ts', content: 'console.log(1);' },
    ];

    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: fakeEntries })),
      prepararComAst: vi.fn(async (entries: any) => entries.map((e: any) => ({ ...e, ast: null }))),
      executarInquisicao: vi.fn(async () => ({ ocorrencias: [], fileEntries: fakeEntries })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));

    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        GUARDIAN_ENABLED: false,
        GUARDIAN_BASELINE: 'baseline.json',
        ZELADOR_STATE_DIR: '.oraculo',
        ZELADOR_IGNORE_PATTERNS: ['node_modules/**'],
        GUARDIAN_IGNORE_PATTERNS: ['node_modules/**'],
        VERBOSE: false,
        COMPACT_MODE: false,
        SCAN_ONLY: false,
        REPORT_EXPORT_ENABLED: false,
      },
    }));
    vi.doMock('../nucleo/constelacao/log.js', () => ({
      log: { info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn() },
    }));

    // Monkey-patch: força codePointAt a retornar null para qualquer chamada
    (String.prototype as any).codePointAt = function (_pos?: number) {
      return null;
    };

    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
    program.addCommand(cmd);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await program.parseAsync(['node', 'cli', 'diagnosticar', '--json']);
    const out = consoleSpy.mock.calls.at(-1)?.[0] as string;
    // não deve conter nenhum padrão \uXXXX de caractere não ASCII, porque foi removido (string vazia)
    // e também deve continuar sendo JSON válido
    expect(() => JSON.parse(out)).not.toThrow();
    consoleSpy.mockRestore();
  });
});
