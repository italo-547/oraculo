// SPDX-License-Identifier: MIT
import { describe, it, vi, beforeEach, expect } from 'vitest';

vi.mock('../../src/analistas/analista-padroes-uso.js', () => ({
  estatisticasUsoGlobal: {
    consts: { A: 4, B: 2 }, // A > 3 será listado
    requires: { fs: 5, path: 1 }, // fs > 3 será listado
  },
}));

vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: {
    info: vi.fn(),
    sucesso: vi.fn(),
    aviso: vi.fn(),
  },
}));

import { log } from '../../src/nucleo/constelacao/log.js';
import { exibirRelatorioZeladorSaude } from '../../src/relatorios/relatorio-zelador-saude.js';

describe('relatorio-zelador-saude — blocos consts/requires', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista consts e requires repetidos quando acima do limite', () => {
    // sem ocorrências de funções longas para cair nos blocos de consts/requires
    exibirRelatorioZeladorSaude([]);
    expect(log.info).toHaveBeenCalledWith(
      expect.stringContaining('Constantes definidas mais de 3 vezes'),
    );
    expect(log.info).toHaveBeenCalledWith(
      expect.stringContaining('Módulos require utilizados mais de 3 vezes'),
    );
  });
});
