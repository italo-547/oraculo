// SPDX-License-Identifier: MIT
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { Command } from 'commander';

const ORIG_ENV: Record<string, string | undefined> = { ...process.env } as any;

describe('comandoDiagnosticar – branches não-JSON (exit 0 quando sem problemas)', () => {
  beforeEach(() => {
    vi.resetModules();
    // simula runtime fora de VITEST para acionar caminhos de exit e blocos
    delete (process.env as any).VITEST;
  });
  afterEach(() => {
    vi.restoreAllMocks();
    for (const k of Object.keys(process.env)) delete (process.env as any)[k];
    for (const [k, v] of Object.entries(ORIG_ENV)) if (v !== undefined) (process.env as any)[k] = v;
  });

  it('sem ocorrências: imprime sucesso e chama process.exit(0)', async () => {
    // Mocks leves para evitar custo de execução
    vi.doMock('../nucleo/constelacao/log.js', () => ({
      log: {
        info: vi.fn(),
        sucesso: vi.fn(),
        aviso: vi.fn(),
        erro: vi.fn(),
        fase: vi.fn(),
        infoDestaque: vi.fn(),
        imprimirBloco: vi.fn(),
        calcularLargura: vi.fn(() => 84),
      },
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        REPORT_SILENCE_LOGS: false,
        GUARDIAN_ENABLED: false,
        GUARDIAN_BASELINE: 'baseline.json',
        ZELADOR_STATE_DIR: '.',
        VERBOSE: false,
        COMPACT_MODE: false,
        SCAN_ONLY: false,
        REPORT_EXPORT_ENABLED: false,
        PARSE_ERRO_FALHA: false,
      },
    }));
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
      prepararComAst: vi.fn(async (fes: any) => fes),
      executarInquisicao: vi.fn(async () => ({ ocorrencias: [], metricas: undefined })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    vi.doMock('../relatorios/relatorio-estrutura.js', () => ({ gerarRelatorioEstrutura: vi.fn() }));
    vi.doMock('../relatorios/relatorio-zelador-saude.js', () => ({
      exibirRelatorioZeladorSaude: vi.fn(),
    }));
    vi.doMock('../relatorios/relatorio-padroes-uso.js', () => ({
      exibirRelatorioPadroesUso: vi.fn(),
    }));
    vi.doMock('../arquitetos/analista-estrutura.js', () => ({
      alinhamentoEstrutural: vi.fn(async () => []),
    }));
    vi.doMock('../analistas/detector-estrutura.ts', () => ({ sinaisDetectados: [] }));
    vi.doMock('../arquitetos/diagnostico-projeto.js', () => ({ diagnosticarProjeto: vi.fn() }));
    vi.doMock('../relatorios/conselheiro-oracular.js', () => ({ emitirConselhoOracular: vi.fn() }));

    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(((code?: number) => undefined) as any);
    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));
    await program.parseAsync(['node', 'cli', 'diagnosticar']);
    // Em modo não-JSON, quando não há problemas, o CLI não invoca process.exit explicitamente
    expect(exitSpy).not.toHaveBeenCalled();
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    const sucessoCalls = (log.sucesso as any).mock.calls.map((c: any[]) => String(c[0])).join('\n');
    expect(sucessoCalls).toMatch(/Repositório impecável/);
    exitSpy.mockRestore();
  });
});
