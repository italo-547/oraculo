import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comandoDiagnosticar – scan-only export erro', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1';
  });

  it('quando export falha em scan-only, registra log.erro e prossegue', async () => {
    const logMock = {
      info: vi.fn(),
      sucesso: vi.fn(),
      aviso: vi.fn(),
      erro: vi.fn(),
      infoDestaque: vi.fn(),
    } as any;
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.doMock('chalk', () => ({
      default: { bold: (x: string) => x, dim: (x: string) => x, cyan: { bold: (x: string) => x } },
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        GUARDIAN_ENABLED: false,
        GUARDIAN_ENFORCE_PROTECTION: false,
        VERBOSE: false,
        COMPACT_MODE: false,
        REPORT_SILENCE_LOGS: false,
        SCAN_ONLY: true,
        REPORT_EXPORT_ENABLED: true,
        REPORT_OUTPUT_DIR: 'tmp-scan-only',
        PARSE_ERRO_FALHA: false,
        // Necessários por src/guardian/constantes.ts
        GUARDIAN_BASELINE: '.oraculo/baseline.json',
        ZELADOR_STATE_DIR: '.oraculo',
      },
    }));
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [{ relPath: 'a.ts', content: 'x' }] })),
      prepararComAst: vi.fn(async (fes: any) => fes.map((f: any) => ({ ...f, ast: {} }))),
      executarInquisicao: vi.fn(async () => ({
        ocorrencias: [],
        metricas: { analistas: [], totalArquivos: 1, tempoAnaliseMs: 1, tempoParsingMs: 1 },
      })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    // Força falha ao salvar export
    vi.doMock('../zeladores/util/persistencia.js', () => ({
      salvarEstado: vi.fn(async () => {
        throw new Error('falha escrever');
      }),
    }));
    vi.doMock('../analistas/detector-estrutura.js', () => ({ sinaisDetectados: [] }));

    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));
    await program.parseAsync(['node', 'cli', 'diagnosticar']);

    const erroJoined = logMock.erro.mock.calls.map((c: any[]) => c[0]).join('\n');
    expect(erroJoined).toMatch(/Falha ao exportar relatório de scan-only/);
  });
});
