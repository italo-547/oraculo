// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comandoDiagnosticar agregação TODO_PENDENTE - catch silencioso', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('se ocorrer erro na agregação, não quebra o fluxo', async () => {
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();

    const fakeEntries = [
      { relPath: 'f1.ts', fullPath: process.cwd() + '/f1.ts', content: '// todo' },
    ];

    // Mock inquisidor para devolver ocorrências e lançar dentro do loop (via getter que dispara erro)
    const ocorrencias = [{ tipo: 'TODO_PENDENTE', mensagem: 'todo', relPath: 'f1.ts' }];

    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: fakeEntries })),
      prepararComAst: vi.fn(async (entries: any) => entries.map((e: any) => ({ ...e, ast: null }))),
      executarInquisicao: vi.fn(async () => ({
        ocorrencias: new Proxy(ocorrencias, {
          // Força erro quando o código tentar iterar (simula falha interna no bloco try)
          get(target, prop, receiver) {
            if (prop === Symbol.iterator) {
              throw new Error('iterador quebrado');
            }
            return Reflect.get(target, prop, receiver);
          },
        }),
        fileEntries: fakeEntries,
      })),
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
      log: {
        info: vi.fn(),
        sucesso: vi.fn(),
        aviso: vi.fn(),
        erro: vi.fn(),
        infoDestaque: vi.fn(),
        calcularLargura: vi.fn(),
        imprimirBloco: vi.fn(),
      },
    }));
    vi.doMock('chalk', () => ({
      default: {
        bold: (x: string) => x,
        cyan: { bold: (x: string) => x },
        yellow: { bold: (x: string) => x },
        green: { bold: (x: string) => x },
      },
    }));

    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
    program.addCommand(cmd);

    // Não deve lançar nem sair; apenas seguir e produzir sumário não-JSON
    await program.parseAsync(['node', 'cli', 'diagnosticar']);
    // Se chegou aqui sem exceção, o catch silencioso funcionou
    expect(true).toBe(true);
  });
});
