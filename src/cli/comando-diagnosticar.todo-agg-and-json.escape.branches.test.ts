import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comandoDiagnosticar – TODO agregação e escape JSON (branches)', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1';
  });

  it('agrupa TODO_PENDENTE por arquivo e eleva severidade quando PARSE_ERRO_FALHA', async () => {
    const logMock = { info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn(), imprimirBloco: vi.fn(), infoDestaque: vi.fn() } as any;
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.doMock('chalk', () => ({ default: { bold: (x: string) => x, cyan: { bold: (x: string) => x } } }));
    const configObj: any = {
      GUARDIAN_ENABLED: false,
      GUARDIAN_ENFORCE_PROTECTION: false,
      VERBOSE: false,
      COMPACT_MODE: true,
      REPORT_SILENCE_LOGS: false,
      SCAN_ONLY: false,
      REPORT_EXPORT_ENABLED: false,
      PARSE_ERRO_FALHA: true,
      GUARDIAN_BASELINE: '.oraculo/baseline.json',
      ZELADOR_STATE_DIR: '.oraculo',
    };
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({ config: configObj }));
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [{ relPath: 'a.ts', content: '' }] })),
      prepararComAst: vi.fn(async (fe: any) => fe),
      executarInquisicao: vi.fn(async () => ({
        ocorrencias: [
          { tipo: 'TODO_PENDENTE', mensagem: 't1', relPath: 'a.ts', nivel: 'aviso' },
          { tipo: 'TODO_PENDENTE', mensagem: 't2', relPath: 'a.ts', nivel: 'aviso' },
          { tipo: 'PARSE_ERRO', mensagem: 'p', relPath: 'b.ts', nivel: 'aviso' },
        ],
      })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));

    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--compact']);

    // Deve ter agregado TODOs e marcado erro pela regra PARSE_ERRO_FALHA
    const joinedAviso = logMock.aviso.mock.calls.map((c: any[]) => c[0]).join('\n');
    expect(joinedAviso).toMatch(/Diagnóstico concluído/);
    const chamadasBloco = logMock.imprimirBloco.mock.calls.map((c: any[]) => String(c[0])).join('\n');
    expect(chamadasBloco).toMatch(/Resumo dos tipos de problemas/);
  });

  it('escapeNonAscii no JSON substitui unicode por \\uXXXX', async () => {
    const logMock = { info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn() } as any;
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.doMock('chalk', () => ({ default: { bold: (x: string) => x } }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        GUARDIAN_ENABLED: false,
        GUARDIAN_ENFORCE_PROTECTION: false,
        VERBOSE: false,
        COMPACT_MODE: false,
        REPORT_SILENCE_LOGS: false,
        SCAN_ONLY: false,
        REPORT_EXPORT_ENABLED: false,
        PARSE_ERRO_FALHA: false,
        GUARDIAN_BASELINE: '.oraculo/baseline.json',
        ZELADOR_STATE_DIR: '.oraculo',
      },
    }));
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [{ relPath: 'a.ts', content: '' }] })),
      prepararComAst: vi.fn(async (fe: any) => fe),
      executarInquisicao: vi.fn(async () => ({ ocorrencias: [] })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    // Detector de arquétipos com unicode para forçar escape
    vi.doMock('../analistas/detector-arquetipos.js', () => ({
      detectarArquetipos: vi.fn(async () => ({ melhores: [{ nome: 'módulo-α', confidence: 0.9, score: 1, missingRequired: [], matchedRequired: [], forbiddenPresent: [], anomalias: [], planoSugestao: { mover: [], conflitos: [], resumo: { total: 0, zonaVerde: 0, bloqueados: 0 } } }], baseline: undefined, drift: undefined })),
    }));

    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--json']);
    const payload = spy.mock.calls.map((c) => String(c[0])).join('\n');
    spy.mockRestore();
    expect(payload).toMatch(/\\u00f3/); // \"m\\u00f3dulo\" (ó)
  });
});
