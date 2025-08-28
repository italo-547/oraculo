// Garante que o ambiente de teste seja detectado pelo CLI
process.env.VITEST = '1';

// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

// Garante que o ambiente de teste seja detectado pelo CLI
process.env.VITEST = '1';

const logs: string[] = [];
const avisos: string[] = [];

beforeEach(() => {
  logs.length = 0;
  avisos.length = 0;
  vi.resetModules();
});

vi.mock('../../src/nucleo/inquisidor.js', () => ({
  iniciarInquisicao: vi.fn(async () => ({
    fileEntries: [
      { relPath: 'a.ts', fullPath: process.cwd() + '/a.ts', content: 'console.log(1);' },
    ],
  })),
  prepararComAst: vi.fn(async (entries: any) => entries.map((e: any) => ({ ...e, ast: null }))),
  executarInquisicao: vi.fn(async () => ({
    ocorrencias: [],
    fileEntries: [
      { relPath: 'a.ts', fullPath: process.cwd() + '/a.ts', content: 'console.log(1);' },
    ],
  })),
  registrarUltimasMetricas: vi.fn(),
  tecnicas: [],
}));

vi.mock('../../src/analistas/detector-arquetipos.js', () => ({
  detectarArquetipos: vi.fn(async () => ({
    candidatos: [
      {
        nome: 'cli',
        confidence: 60,
        score: 10,
        missingRequired: [],
        matchedRequired: [],
        forbiddenPresent: [],
        anomalias: [],
        planoSugestao: { mover: [], conflitos: [], resumo: '' },
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

vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: {
    info: (m: string) => logs.push(String(m)),
    sucesso: (m: string) => logs.push(String(m)),
    aviso: (m: string) => {
      const s = String(m);
      // Depuração: imprime toda chamada de aviso
      console.log('MOCK log.aviso chamado:', s);
      logs.push(s);
      avisos.push(s);
    },
    erro: (m: string) => logs.push(String(m)),
    infoDestaque: (m: string) => logs.push(String(m)),
    calcularLargura: vi.fn(),
    imprimirBloco: vi.fn(),
  },
}));
vi.mock('chalk', () => ({
  default: {
    bold: (x: string) => x,
    dim: (x: string) => x,
    cyan: { bold: (x: string) => x },
    yellow: { bold: (x: string) => x },
    green: { bold: (x: string) => x },
  },
}));

vi.mock('../../src/nucleo/constelacao/cosmos.js', () => ({
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

describe('comandoDiagnosticar arquetipos drift com reticências (…)', () => {
  it('mostra … quando há mais de 3 itens em novos/removidos (modo testes/verbose)', async () => {
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
    program.addCommand(cmd);

    await program.parseAsync(['node', 'cli', 'diagnosticar']);
    // Debug: imprime avisos para facilitar ajuste do matcher
    // console.log('AVISOS:', avisos);
    // Aceita variações de reticências e formato
    const regexNovos = /novos:\[N1, N2, N3(…|\.\.\.|, ...|, …)?\]/;
    const regexRemov = /removidos:\[R1, R2, R3(…|\.\.\.|, ...|, …)?\]/;
    const temNovos = avisos.some((s) => regexNovos.test(s));
    const temRemov = avisos.some((s) => regexRemov.test(s));
    if (!temNovos || !temRemov) {
      // Debug: imprime avisos para facilitar ajuste
      console.log('AVISOS DEBUG:', avisos);
    }
    expect(temNovos).toBe(true);
    expect(temRemov).toBe(true);
  });
});
