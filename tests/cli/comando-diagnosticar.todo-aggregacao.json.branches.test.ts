// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

// Cobre branch de agregação de TODO_PENDENTE sob modo JSON, colapsando múltiplos por arquivo

describe('comando-diagnosticar – agregação TODO_PENDENTE no JSON (branches)', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1';
  });

  it('colapsa múltiplos TODO_PENDENTE por arquivo em uma única ocorrência agregada', async () => {
    const logMock = { info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn() } as any;
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.doMock('chalk', () => ({ default: { bold: (x: string) => x } }));

    const cfg = {
      DEV_MODE: false,
      GUARDIAN_ENABLED: false,
      GUARDIAN_BASELINE: 'guardian-baseline.json',
      ZELADOR_STATE_DIR: '.oraculo',
      VERBOSE: false,
      COMPACT_MODE: true,
      REPORT_SILENCE_LOGS: false,
      SCAN_ONLY: false,
      REPORT_EXPORT_ENABLED: false,
      PARSE_ERRO_FALHA: true,
    } as any;
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({ config: cfg }));

    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [{ relPath: 'a.ts', content: 'x' }] })),
      prepararComAst: vi.fn(async (fes: any) => fes.map((f: any) => ({ ...f, ast: {} }))),
      executarInquisicao: vi.fn(async () => ({
        ocorrencias: [
          { tipo: 'TODO_PENDENTE', mensagem: 'todo 1', relPath: 'a.ts', nivel: 'aviso' },
          { tipo: 'TODO_PENDENTE', mensagem: 'todo 2', relPath: 'a.ts', nivel: 'aviso' },
          { tipo: 'X', mensagem: 'm', relPath: 'b.ts', nivel: 'erro' },
        ],
        metricas: { analistas: [], totalArquivos: 2, tempoAnaliseMs: 1, tempoParsingMs: 1 },
        fileEntries: [],
      })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));

    // Capturar stdout JSON para verificar agregação
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (msg?: any) => {
      if (typeof msg === 'string') logs.push(msg);
    };

    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--json']);

    console.log = origLog; // restore

    // Deve ter apenas uma ocorrência TODO_PENDENTE com mensagem agregada
    const saida = JSON.parse(logs.join('\n'));
    const todos = saida.ocorrencias.filter((o: any) => o.tipo === 'TODO_PENDENTE');
    expect(todos.length).toBe(1);
    expect(todos[0].mensagem).toMatch(/TODOs pendentes/);
  });
});
