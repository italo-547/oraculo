import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { Command } from 'commander';

const ORIG_ENV: Record<string, string | undefined> = { ...process.env } as any;

describe('comandoDiagnosticar – JSON exits (branches)', () => {
  beforeEach(() => {
    vi.resetModules();
    // Força ambiente não-test para cobrir branches de exit
    delete (process.env as any).VITEST;
  });
  afterEach(() => {
    vi.restoreAllMocks();
    for (const k of Object.keys(process.env)) delete (process.env as any)[k];
    for (const [k, v] of Object.entries(ORIG_ENV)) if (v !== undefined) (process.env as any)[k] = v;
  });

  it('em modo --json chama process.exit(0) quando ok e process.exit(1) quando temErro', async () => {
    // Mocks básicos
    const logMock = {
      info: vi.fn(),
      sucesso: vi.fn(),
      aviso: vi.fn(),
      erro: vi.fn(),
      debug: vi.fn(),
      fase: vi.fn(),
      infoDestaque: vi.fn(),
    };
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        REPORT_SILENCE_LOGS: false,
        GUARDIAN_ENABLED: false,
        VERBOSE: false,
        COMPACT_MODE: false,
        SCAN_ONLY: false,
        REPORT_EXPORT_ENABLED: false,
        PARSE_ERRO_FALHA: false,
        GUARDIAN_BASELINE: '.oraculo/guardian-baseline.json',
        ZELADOR_STATE_DIR: '.oraculo',
      },
    }));
    // Evita dependências do módulo guardian/constantes
    vi.doMock('../guardian/sentinela.js', () => ({
      scanSystemIntegrity: vi.fn(async () => ({ status: 'ok' })),
    }));
    // Primeiro run: OK (sem ocorrências)
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
      prepararComAst: vi.fn(async (fes: any) => fes),
      executarInquisicao: vi.fn(async () => ({
        ocorrencias: [],
        metricas: { analistas: [], totalArquivos: 0, tempoAnaliseMs: 0, tempoParsingMs: 0 },
      })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    vi.doMock('../analistas/detector-estrutura.js', () => ({ sinaisDetectados: [] }));
    vi.doMock('../arquitetos/analista-estrutura.js', () => ({
      alinhamentoEstrutural: vi.fn(() => []),
    }));
    vi.doMock('../relatorios/relatorio-estrutura.js', () => ({ gerarRelatorioEstrutura: vi.fn() }));
    vi.doMock('../relatorios/relatorio-zelador-saude.js', () => ({
      exibirRelatorioZeladorSaude: vi.fn(),
    }));
    vi.doMock('../relatorios/relatorio-padroes-uso.js', () => ({
      exibirRelatorioPadroesUso: vi.fn(),
    }));
    vi.doMock('../relatorios/conselheiro-oracular.js', () => ({ emitirConselhoOracular: vi.fn() }));

    // Garante que resíduos de globais de parse errors não contaminem o teste
    (globalThis as any).__ORACULO_PARSE_ERROS__ = [];
    (globalThis as any).__ORACULO_PARSE_ERROS_ORIGINAIS__ = 0;
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      // no-op: apenas registra chamada para asserção
    }) as any);
    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--json']);
    expect(exitSpy).toHaveBeenCalled();
    expect(exitSpy.mock.calls.at(-1)?.[0]).toBe(0);

    // Segundo run: temErro (uma ocorrência nível erro)
    vi.resetModules();
    // Reaplica mocks com uma ocorrência de erro
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        REPORT_SILENCE_LOGS: false,
        GUARDIAN_ENABLED: false,
        VERBOSE: false,
        COMPACT_MODE: false,
        SCAN_ONLY: false,
        REPORT_EXPORT_ENABLED: false,
        PARSE_ERRO_FALHA: false,
        GUARDIAN_BASELINE: '.oraculo/guardian-baseline.json',
        ZELADOR_STATE_DIR: '.oraculo',
      },
    }));
    vi.doMock('../guardian/sentinela.js', () => ({
      scanSystemIntegrity: vi.fn(async () => ({ status: 'ok' })),
    }));
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
      prepararComAst: vi.fn(async (fes: any) => fes),
      executarInquisicao: vi.fn(async () => ({
        ocorrencias: [{ tipo: 'X', nivel: 'erro', relPath: 'a.ts', mensagem: 'm' }],
        metricas: { analistas: [], totalArquivos: 1, tempoAnaliseMs: 1, tempoParsingMs: 1 },
      })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    vi.doMock('../analistas/detector-estrutura.js', () => ({ sinaisDetectados: [] }));
    vi.doMock('../arquitetos/analista-estrutura.js', () => ({
      alinhamentoEstrutural: vi.fn(() => []),
    }));
    vi.doMock('../relatorios/relatorio-estrutura.js', () => ({ gerarRelatorioEstrutura: vi.fn() }));
    vi.doMock('../relatorios/relatorio-zelador-saude.js', () => ({
      exibirRelatorioZeladorSaude: vi.fn(),
    }));
    vi.doMock('../relatorios/relatorio-padroes-uso.js', () => ({
      exibirRelatorioPadroesUso: vi.fn(),
    }));
    vi.doMock('../relatorios/conselheiro-oracular.js', () => ({ emitirConselhoOracular: vi.fn() }));
    // Limpa globais antes do segundo run
    (globalThis as any).__ORACULO_PARSE_ERROS__ = [];
    (globalThis as any).__ORACULO_PARSE_ERROS_ORIGINAIS__ = 0;
    const { comandoDiagnosticar: comando2 } = await import('./comando-diagnosticar.js');
    const program2 = new Command();
    program2.addCommand(comando2(() => {}));
    await program2.parseAsync(['node', 'cli', 'diagnosticar', '--json']);
    expect(exitSpy.mock.calls.at(-1)?.[0]).toBe(1);
    exitSpy.mockRestore();
  });
});
