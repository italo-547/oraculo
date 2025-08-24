// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comandoDiagnosticar arquetipos drift com reticências (…)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('mostra … quando há mais de 3 itens em novos/removidos (modo testes/verbose)', async () => {
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    const fakeEntries = [
      { relPath: 'a.ts', fullPath: process.cwd() + '/a.ts', content: 'console.log(1);' },
    ];

    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: fakeEntries })),
      prepararComAst: vi.fn(async (entries: any) => entries.map((e: any) => ({ ...e, ast: null }))),
      executarInquisicao: vi.fn(async () => ({ ocorrencias: [], fileEntries: fakeEntries })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));

    vi.doMock('../analistas/detector-arquetipos.js', () => ({
      detectarArquetipos: vi.fn(async () => ({
        melhores: [
          {
            nome: 'cli',
            confidence: 60,
            score: 10,
            missingRequired: [],
            matchedRequired: [],
            forbiddenPresent: [],
            anomalias: [],
          },
        ],
        baseline: {
          version: 1,
          timestamp: new Date().toISOString(),
          arquetipo: 'cli',
          confidence: 60,
          arquivosRaiz: ['README.md'],
        },
        drift: {
          alterouArquetipo: false,
          anterior: 'cli',
          atual: 'cli',
          deltaConfidence: -5,
          arquivosRaizNovos: ['N1', 'N2', 'N3', 'N4'],
          arquivosRaizRemovidos: ['R1', 'R2', 'R3', 'R4'],
        },
      })),
    }));

    const logs: string[] = [];
    const avisos: string[] = [];
    vi.doMock('../nucleo/constelacao/log.js', () => ({
      log: {
        info: (m: string) => logs.push(String(m)),
        sucesso: (m: string) => logs.push(String(m)),
        aviso: (m: string) => {
          const s = String(m);
          logs.push(s);
          avisos.push(s);
        },
        erro: (m: string) => logs.push(String(m)),
        infoDestaque: (m: string) => logs.push(String(m)),
        calcularLargura: vi.fn(),
        imprimirBloco: vi.fn(),
      },
    }));
    vi.doMock('chalk', () => ({
      default: {
        bold: (x: string) => x,
        dim: (x: string) => x,
        cyan: { bold: (x: string) => x },
        yellow: { bold: (x: string) => x },
        green: { bold: (x: string) => x },
      },
    }));

    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        GUARDIAN_ENABLED: false,
        GUARDIAN_BASELINE: 'baseline.json',
        ZELADOR_STATE_DIR: '.oraculo',
        ZELADOR_IGNORE_PATTERNS: ['node_modules/**'],
        GUARDIAN_IGNORE_PATTERNS: ['node_modules/**'],
        VERBOSE: true,
        COMPACT_MODE: false,
        SCAN_ONLY: false,
        REPORT_EXPORT_ENABLED: false,
      },
    }));

    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
    program.addCommand(cmd);

    await program.parseAsync(['node', 'cli', 'diagnosticar']);
    // Verifica em alguma chamada de aviso os trechos com reticências e listas truncadas
    const temNovos = avisos.some((s) => /novos:\[N1, N2, N3…\]/.test(s));
    const temRemov = avisos.some((s) => /removidos:\[R1, R2, R3…\]/.test(s));
    expect(temNovos).toBe(true);
    expect(temRemov).toBe(true);
  });
});
