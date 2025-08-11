import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exibirRelatorioPadroesUso } from './relatorio-padroes-uso.js';

vi.mock('../nucleo/constelacao/log.js', () => ({
  log: {
    info: vi.fn(),
    sucesso: vi.fn(),
  },
}));

let log: any;
beforeEach(async () => {
  vi.resetModules();
  log = (await import('../nucleo/constelacao/log.js')).log;
});

describe('exibirRelatorioPadroesUso', () => {
  it('chama log.info e log.sucesso com as mensagens esperadas', () => {
    exibirRelatorioPadroesUso();
    expect(log.info).toHaveBeenCalledWith(expect.stringMatching(/Padrões de Uso/));
    expect(log.sucesso).toHaveBeenCalledWith(expect.stringMatching(/Fim do relatório/));
  });
});
