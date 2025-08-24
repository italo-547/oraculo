// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('relatorio-zelador-saude – ramos adicionais de aviso e fallback', () => {
  const origEnv = { ...process.env } as Record<string, string | undefined>;
  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1'; // evitar molduras
  });
  afterEach(() => {
    vi.restoreAllMocks();
    for (const k of Object.keys(process.env)) delete (process.env as any)[k];
    for (const [k, v] of Object.entries(origEnv)) if (v !== undefined) (process.env as any)[k] = v;
  });

  it('quando log.aviso não existe, usa log.info para a mensagem de funções longas', async () => {
    // sem aviso; define fns dentro do factory para evitar problemas de hoist
    vi.mock('../../src/nucleo/constelacao/log.js', () => {
      const info = vi.fn();
      const sucesso = vi.fn();
      return { log: { info, sucesso } };
    });
    vi.mock('../../src/analistas/analista-padroes-uso.js', () => ({
      estatisticasUsoGlobal: { consts: {}, requires: {} },
    }));
    const cosmos = await import('../../src/nucleo/constelacao/cosmos.js');
    cosmos.config.RELATORIO_SAUDE_TABELA_ENABLED = false;
    cosmos.config.VERBOSE = false;
    const { exibirRelatorioZeladorSaude } = await import(
      '../../src/relatorios/relatorio-zelador-saude.js'
    );
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    exibirRelatorioZeladorSaude([
      { tipo: 'FUNCAO_LONGA', nivel: 'aviso', mensagem: 'm', relPath: 'a.ts', linha: 1 },
    ] as any);
    const out = (log as any).info.mock.calls.flat().join('\n');
    expect(out).toMatch(/Funções longas/);
    expect((log as any).sucesso).toHaveBeenCalled();
  });
});
