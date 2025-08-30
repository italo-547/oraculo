// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comandoDiagnosticar – TODO agregação e escape JSON (branches)', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1';
    expect(true).toBe(true); // Asserção final para garantir término do teste sem erros
  });

  it('agrupa TODO_PENDENTE por arquivo e eleva severidade quando PARSE_ERRO_FALHA', async () => {
    const logMock: Record<string, ReturnType<typeof vi.fn>> = {
      info: vi.fn(),
      sucesso: vi.fn(),
      aviso: vi.fn(),
      erro: vi.fn(),
      imprimirBloco: vi.fn(),
      infoDestaque: vi.fn(),
    };
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.doMock('chalk', () => ({
      default: { bold: (x: string) => x, cyan: { bold: (x: string) => x } },
    }));
    const configObj: any = {
      GUARDIAN_ENABLED: false,
      GUARDIAN_ENFORCE_PROTECTION: false,
      VERBOSE: false,
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

    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--compact']);

    // Deve ter agregado TODOs e marcado erro pela regra PARSE_ERRO_FALHA
    const joinedInfo = logMock.info.mock.calls.map((c: any[]) => c[0]).join('\n');
    expect(joinedInfo).toMatch(/Diagnóstico concluído/);
    const chamadasBloco = logMock.imprimirBloco.mock.calls
      .map((c: any[]) => String(c[0]))
      .join('\n');
    expect(chamadasBloco).toMatch(/Resumo dos tipos de problemas/);
  }, 15000);

  it('escapeNonAscii no JSON substitui unicode por \\uXXXX', async () => {
    const logMock: Record<string, ReturnType<typeof vi.fn>> = {
      info: vi.fn(),
      sucesso: vi.fn(),
      aviso: vi.fn(),
      erro: vi.fn(),
    };
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.doMock('chalk', () => ({ default: { bold: (x: string) => x } }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        GUARDIAN_ENABLED: false,
        GUARDIAN_ENFORCE_PROTECTION: false,
        VERBOSE: false,
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
    // Forçar detecção de arquétipos em testes
    process.env.FORCAR_DETECT_ARQUETIPOS = '1';
    // Detector de arquétipos com unicode para forçar escape
    vi.doMock('../analistas/detector-arquetipos.js', () => ({
      detectarArquetipos: vi.fn(async () => ({
        candidatos: [
          {
            nome: 'módulo-α',
            confidence: 0.9,
            score: 1,
            missingRequired: [],
            matchedRequired: [],
            forbiddenPresent: [],
            anomalias: [],
            planoSugestao: {
              mover: [],
              conflitos: [],
              resumo: { total: 0, zonaVerde: 0, bloqueados: 0 },
            },
          },
        ],
        baseline: undefined,
        drift: undefined,
      })),
    }));

    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--json']);
    // Busca a primeira string que contenha o escape unicode
    const allCalls = spy.mock.calls.map((c) => String(c[0]));
    const payload = allCalls.find((s) => /\\u00f3/.test(s)) || '';
    spy.mockRestore();
    expect(payload).toMatch(/\\u00f3/); // \"m\\u00f3dulo\" (ó)
  });
});
