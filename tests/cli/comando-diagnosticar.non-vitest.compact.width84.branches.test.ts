// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comandoDiagnosticar molduras runtime com COMPACT_MODE usa largura 84 fallback', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.VITEST; // simula runtime real
  });

  it('usa 84 quando calcularLargura é ausente e COMPACT_MODE=true', async () => {
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();

    const fakeEntries = [
      { relPath: 'a.ts', fullPath: process.cwd() + '/a.ts', content: 'console.log(1);' },
    ];

    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: fakeEntries })),
      prepararComAst: vi.fn(async (entries: any) => entries.map((e: any) => ({ ...e, ast: null }))),
      executarInquisicao: vi.fn(async () => ({
        ocorrencias: [{ tipo: 'X', relPath: 'a.ts', mensagem: 'm' }],
        fileEntries: fakeEntries,
      })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));

    // Mock detector de arquetipos com baseline para acionar bloco de resumo runtime
    vi.doMock('../analistas/detector-arquetipos.js', () => ({
      detectarArquetipos: vi.fn(async () => ({
        candidatos: [
          {
            nome: 'cli-modular',
            confidence: 80,
            score: 40,
            missingRequired: [],
            matchedRequired: [],
            forbiddenPresent: [],
            anomalias: [],
          },
        ],
        baseline: {
          version: 1,
          timestamp: new Date().toISOString(),
          arquetipo: 'cli-modular',
          confidence: 80,
          arquivosRaiz: ['README.md'],
        },
        drift: {
          alterouArquetipo: false,
          anterior: 'cli-modular',
          atual: 'cli-modular',
          deltaConfidence: 0,
          arquivosRaizNovos: [],
          arquivosRaizRemovidos: [],
        },
      })),
    }));

    let larguraUsada: number | undefined;
    vi.doMock('../nucleo/constelacao/log.js', () => ({
      log: {
        info: vi.fn(),
        sucesso: vi.fn(),
        aviso: vi.fn(),
        erro: vi.fn(),
        infoDestaque: vi.fn(),
        imprimirBloco: vi.fn((titulo: string, linhas: string[], cor: any, largura: number) => {
          if (titulo === 'Resumo da estrutura') {
            larguraUsada = largura;
          }
        }),
      },
    }));
    vi.doMock('chalk', () => ({
      default: { bold: (x: string) => x, cyan: { bold: (x: string) => x } },
    }));

    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        GUARDIAN_ENABLED: false,
        GUARDIAN_BASELINE: 'baseline.json',
        ZELADOR_STATE_DIR: '.oraculo',
        ZELADOR_IGNORE_PATTERNS: ['node_modules/**'],
        GUARDIAN_IGNORE_PATTERNS: ['node_modules/**'],
        VERBOSE: false,
        COMPACT_MODE: true,
        SCAN_ONLY: false,
        REPORT_EXPORT_ENABLED: false,
      },
    }));

    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
    program.addCommand(cmd);

    // Evita que um eventual process.exit encerre o runner
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      // no-op para não derrubar o teste
      return undefined as never;
    }) as any);

    await program.parseAsync(['node', 'cli', 'diagnosticar', '--compact']);
    expect(larguraUsada).toBe(84); // fallback esperado
    exitSpy.mockRestore();
  });
});
