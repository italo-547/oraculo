import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comandoDiagnosticar – JSON com erro retorna status erro', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1';
  });

  it('quando PARSE_ERRO_FALHA e existem PARSE_ERRO, status=erro', async () => {
    const logMock = { info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn() } as any;
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.doMock('chalk', () => ({ default: { bold: (x: string) => x } }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        GUARDIAN_ENABLED: false,
        VERBOSE: false,
        COMPACT_MODE: false,
        REPORT_SILENCE_LOGS: false,
        SCAN_ONLY: false,
        REPORT_EXPORT_ENABLED: false,
        PARSE_ERRO_FALHA: true,
        // Necessários por src/guardian/constantes.ts
        GUARDIAN_BASELINE: '.oraculo/baseline.json',
        ZELADOR_STATE_DIR: '.oraculo',
      },
    }));
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [{ relPath: 'a.ts', content: 'x' }] })),
      prepararComAst: vi.fn(async (fes: any) => fes.map((f: any) => ({ ...f, ast: {} }))),
      executarInquisicao: vi.fn(async () => ({
        ocorrencias: [{ tipo: 'PARSE_ERRO', relPath: 'a.ts', mensagem: 'x', nivel: 'aviso' }],
        metricas: {
          analistas: [],
          totalArquivos: 1,
          tempoAnaliseMs: 1,
          tempoParsingMs: 1,
        },
      })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));

    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));
    const out: string[] = [];
    const origLog = console.log;
    console.log = (m?: any) => out.push(String(m));
    try {
      await program.parseAsync(['node', 'cli', 'diagnosticar', '--json']);
    } finally {
      console.log = origLog;
    }

    const merged = out.join('\n');
    expect(merged).toMatch(/\"status\"\s*:\s*\"erro\"/);
  });
});
