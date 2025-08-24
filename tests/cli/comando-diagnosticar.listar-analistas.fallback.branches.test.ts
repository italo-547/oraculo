// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';

describe('comando-diagnosticar — listar-analistas fallbacks e largura compacta', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('usa valores padrão para nome/categoria/descricao e largura fallback 84 no modo compacto', async () => {
    // Criar mocks hoisted para evitar TDZ em fábricas de vi.mock
    const hoisted = vi.hoisted(() => {
      return {
        imprimirBloco: vi.fn(),
      };
    });
    vi.mock('../../src/nucleo/constelacao/log.js', () => ({
      log: {
        info: vi.fn(),
        aviso: vi.fn(),
        sucesso: vi.fn(),
        erro: vi.fn(),
        imprimirBloco: hoisted.imprimirBloco,
        // Sem calcularLargura para forçar fallback do ternário 84/96
      },
    }));
    // Config compacta ativa para cair em 84
    vi.mock('../../src/nucleo/constelacao/cosmos.js', () => ({
      config: {
        COMPACT_MODE: true,
        VERBOSE: false,
        REPORT_EXPORT_ENABLED: false,
        SCAN_ONLY: false,
        DEV_MODE: false,
        GUARDIAN_BASELINE: 'guardian-baseline.json',
        ZELADOR_STATE_DIR: 'inc-state',
      },
    }));
    // Registry com campos ausentes para acionar fallbacks de texto
    vi.mock('../../src/analistas/registry.js', () => ({
      listarAnalistas: () => [
        { nome: undefined, categoria: undefined, descricao: undefined },
        {
          /* item vazio para reforçar fallbacks */
        } as any,
      ],
    }));
    // Inquisidor mínimo para deixar o fluxo seguir sem ocorrências
    vi.mock('../../src/nucleo/inquisidor.js', () => ({
      iniciarInquisicao: async () => ({ fileEntries: [] }),
      prepararComAst: async (f: any) => f,
      executarInquisicao: async () => ({ ocorrencias: [], metricas: undefined }),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    // Dependências chamadas no caminho não-JSON quando não-compacto (aqui não usaremos)
    vi.mock('../../src/arquitetos/analista-estrutura.js', () => ({
      alinhamentoEstrutural: vi.fn(() => []),
    }));
    vi.mock('../../src/relatorios/relatorio-estrutura.js', () => ({
      gerarRelatorioEstrutura: vi.fn(),
    }));
    vi.mock('../../src/relatorios/relatorio-zelador-saude.js', () => ({
      exibirRelatorioZeladorSaude: vi.fn(),
    }));
    vi.mock('../../src/relatorios/relatorio-padroes-uso.js', () => ({
      exibirRelatorioPadroesUso: vi.fn(),
    }));
    vi.mock('../../src/relatorios/conselheiro-oracular.js', () => ({
      emitirConselhoOracular: vi.fn(),
    }));

    const program = new Command();
    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    program.addCommand(comandoDiagnosticar(() => {}));

    await program.parseAsync(['node', 'cli', 'diagnosticar', '--listar-analistas', '--compact']);

    expect(hoisted.imprimirBloco).toHaveBeenCalled();
    const call = (hoisted.imprimirBloco as any).mock.calls.find(Boolean) as any[];
    // [titulo, linhas, cor, largura]
    const linhas = call[1] as string[];
    const largura = call[3] as number;
    expect(largura).toBe(84);
    // Deve conter fallbacks "desconhecido" e "n/d"
    const joined = linhas.join('\n');
    expect(joined).toMatch(/desconhecido/);
    expect(joined).toMatch(/n\/d/);
  });
});
