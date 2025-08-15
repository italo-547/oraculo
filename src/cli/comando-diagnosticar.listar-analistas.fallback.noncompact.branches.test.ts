import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comando-diagnosticar — listar-analistas largura fallback não-compacta (96)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('quando calcularLargura não existe e sem --compact, usa largura 96', async () => {
    const hoisted = vi.hoisted(() => ({
      imprimirBloco: vi.fn(),
      logMock: {
        info: vi.fn(),
        aviso: vi.fn(),
        erro: vi.fn(),
        sucesso: vi.fn(),
        imprimirBloco: vi.fn(),
      } as any,
    }));
    // Sem calcularLargura
    vi.mock('../nucleo/constelacao/log.js', () => ({ log: hoisted.logMock }));
    vi.mock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        VERBOSE: false,
        COMPACT_MODE: false,
        REPORT_EXPORT_ENABLED: false,
        SCAN_ONLY: false,
        DEV_MODE: false,
        GUARDIAN_BASELINE: 'guardian-baseline.json',
        ZELADOR_STATE_DIR: 'inc-state',
      },
    }));
    vi.mock('../analistas/registry.js', () => ({
      listarAnalistas: () => [{ nome: '', categoria: '', descricao: 'd' }],
    }));
    vi.mock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: async () => ({ fileEntries: [{ relPath: 'a.ts', content: 'x' }] }),
      prepararComAst: async (f: any) => f,
      executarInquisicao: async () => ({ ocorrencias: [], metricas: undefined }),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    vi.mock('../arquitetos/analista-estrutura.js', () => ({
      alinhamentoEstrutural: vi.fn(() => []),
    }));
    vi.mock('../relatorios/relatorio-estrutura.js', () => ({ gerarRelatorioEstrutura: vi.fn() }));
    vi.mock('../relatorios/relatorio-zelador-saude.js', () => ({
      exibirRelatorioZeladorSaude: vi.fn(),
    }));
    vi.mock('../relatorios/relatorio-padroes-uso.js', () => ({
      exibirRelatorioPadroesUso: vi.fn(),
    }));
    vi.mock('../relatorios/conselheiro-oracular.js', () => ({ emitirConselhoOracular: vi.fn() }));

    const program = new Command();
    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    program.addCommand(comandoDiagnosticar(() => {}));

    await program.parseAsync(['node', 'cli', 'diagnosticar', '--listar-analistas']);

    // captura largura passada a imprimirBloco (4º argumento)
    const widths = (hoisted.logMock.imprimirBloco as any).mock.calls.map((c: any[]) => c[3]);
    expect(widths.some((w: unknown) => w === 96)).toBe(true);
  });
});
