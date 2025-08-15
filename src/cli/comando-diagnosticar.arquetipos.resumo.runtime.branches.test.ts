import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';

const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  vi.resetModules();
  saved.VITEST = process.env.VITEST;
  delete (process.env as any).VITEST; // simula runtime
  // Evita que chamadas a process.exit derrubem o runner e eliminam interferência entre testes
  vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
    return undefined as never;
  }) as any);
});

afterEach(() => {
  if (saved.VITEST === undefined) delete (process.env as any).VITEST;
  else process.env.VITEST = saved.VITEST;
  (process.exit as unknown as { mockRestore?: () => void }).mockRestore?.();
});

describe('comando-diagnosticar — bloco Resumo da estrutura (fora de VITEST)', () => {
  it('imprime bloco de resumo quando há baseline/drift', async () => {
    const aplicar = vi.fn();
    const log: any = {
      info: vi.fn(),
      sucesso: vi.fn(),
      aviso: vi.fn(),
      erro: vi.fn(),
      imprimirBloco: vi.fn(),
    };
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log }));
    // Mocka módulos de relatório usados no fluxo não-JSON para evitar execução real e dependências de chalk
    vi.doMock('../relatorios/relatorio-estrutura.js', () => ({ gerarRelatorioEstrutura: vi.fn() }));
    vi.doMock('../relatorios/relatorio-zelador-saude.js', () => ({
      exibirRelatorioZeladorSaude: vi.fn(),
    }));
    vi.doMock('../relatorios/relatorio-padroes-uso.js', () => ({
      exibirRelatorioPadroesUso: vi.fn(),
    }));
    vi.doMock('../arquitetos/diagnostico-projeto.js', () => ({ diagnosticarProjeto: vi.fn() }));
    vi.doMock('../relatorios/conselheiro-oracular.js', () => ({ emitirConselhoOracular: vi.fn() }));
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [{ relPath: 'a' }] })),
      prepararComAst: vi.fn(async (e: any) => e.map((x: any) => ({ ...x, ast: {} }))),
      executarInquisicao: vi.fn(async () => ({ ocorrencias: [] })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    vi.doMock('../analistas/detector-arquetipos.js', () => ({
      detectarArquetipos: vi.fn(async () => ({
        melhores: [
          {
            nome: 'mono',
            confidence: 0.9,
            score: 10,
            missingRequired: [],
            matchedRequired: [],
            forbiddenPresent: [],
            anomalias: [],
          },
        ],
        baseline: {
          version: 1,
          timestamp: Date.now(),
          arquetipo: 'mono',
          confidence: 0.9,
          arquivosRaiz: ['a'],
        },
        drift: {
          alterouArquetipo: false,
          anterior: 'mono',
          atual: 'mono',
          deltaConfidence: 0,
          arquivosRaizNovos: [],
          arquivosRaizRemovidos: [],
        },
      })),
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        DEV_MODE: true,
        VERBOSE: false,
        COMPACT_MODE: false,
        SCAN_ONLY: false,
        REPORT_EXPORT_ENABLED: false,
        GUARDIAN_ENABLED: false,
        REPORT_SILENCE_LOGS: false,
        GUARDIAN_BASELINE: 'baseline.json',
        ZELADOR_STATE_DIR: '.oraculo',
      },
    }));
    // Mock seguro de chalk com cores usadas nos relatórios
    vi.doMock('chalk', () => ({
      default: {
        bold: (x: any) => x,
        cyan: Object.assign((x: any) => x, { bold: (y: any) => y }),
        yellow: Object.assign((x: any) => x, { bold: (y: any) => y }),
        green: Object.assign((x: any) => x, { bold: (y: any) => y }),
      },
    }));

    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const cmd = comandoDiagnosticar(aplicar);
    await cmd.parseAsync(['node', 'cli', 'diagnosticar']);

    const called = (log.imprimirBloco as any).mock.calls.some((c: any[]) =>
      String(c[0]).includes('Resumo da estrutura'),
    );
    expect(called).toBe(true);
  });
});
