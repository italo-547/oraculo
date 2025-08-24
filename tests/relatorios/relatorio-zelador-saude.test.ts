// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exibirRelatorioZeladorSaude } from '../../src/relatorios/relatorio-zelador-saude.js';

vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: {
    info: vi.fn(),
    aviso: vi.fn(),
    sucesso: vi.fn(),
  },
}));
vi.mock('../../src/analistas/analista-padroes-uso.js', () => ({
  estatisticasUsoGlobal: {
    consts: { X: 4, Y: 2 },
    requires: { modA: 5, modB: 1 },
  },
}));

let log: any;
beforeEach(async () => {
  vi.resetModules();
  log = (await import('../../src/nucleo/constelacao/log.js')).log;
});

describe('exibirRelatorioZeladorSaude', () => {
  it('relata funções longas, consts e requires excessivos', () => {
    const ocorrencias = [{ relPath: 'a.ts', linha: 10, mensagem: 'Função longa', tipo: 'aviso' }];
    exibirRelatorioZeladorSaude(ocorrencias);
    const infoCalls = log.info.mock.calls.flat();
    const avisoCalls = log.aviso.mock.calls.flat();
    const sucessoCalls = log.sucesso.mock.calls.flat();
    expect(infoCalls.some((msg: string) => /Relatório de Saúde/.test(msg))).toBe(true);
    expect(avisoCalls.some((msg: string) => /Funções longas/.test(msg))).toBe(true);
    expect(infoCalls.some((msg: string) => /Constantes definidas/.test(msg))).toBe(true);
    expect(infoCalls.some((msg: string) => /Módulos require/.test(msg))).toBe(true);
    expect(sucessoCalls.some((msg: string) => /Fim do relatório/.test(msg))).toBe(true);
  });

  it('relata ausência de funções longas', () => {
    exibirRelatorioZeladorSaude([]);
    expect(log.sucesso).toHaveBeenCalledWith(
      expect.stringMatching(/Nenhuma função acima do limite/),
    );
  });
});
