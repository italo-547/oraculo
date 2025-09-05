// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exibirRelatorioPadroesUso } from '../../src/relatorios/relatorio-padroes-uso.js';

const ORIGINAL_VITEST = process.env.VITEST;

describe('relatorio-padroes-uso branches extra', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    if (ORIGINAL_VITEST !== undefined) process.env.VITEST = ORIGINAL_VITEST;
    else delete (process.env as any).VITEST;
    vi.restoreAllMocks();
  });

  it('usa largura padrão quando calcularLargura não existe (fora do VITEST)', async () => {
    // Força ambiente não-test para acionar moldura
    delete (process.env as any).VITEST;

    vi.mock('../../src/nucleo/constelacao/log.js', () => ({
      log: {
        info: vi.fn(),
        sucesso: vi.fn(),
        // sem calcularLargura
        imprimirBloco: vi.fn(),
      },
    }));

    // reimporta módulo usando mocks acima
    const { exibirRelatorioPadroesUso: run } = await import(
      '../../src/relatorios/relatorio-padroes-uso.js'
    );
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    run();
    expect((log as any).imprimirBloco).toHaveBeenCalled();
    // Não temos acesso direto ao width, mas o ramo sem calcularLargura foi exercitado
  });
});
