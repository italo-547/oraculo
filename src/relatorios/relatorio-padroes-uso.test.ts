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
    const infoCalls = log.info.mock.calls.flat();
    const sucessoCalls = log.sucesso.mock.calls.flat();
    expect(infoCalls.some((msg: string) => /Padrões de Uso/.test(msg))).toBe(true);
    expect(sucessoCalls.some((msg: string) => /Fim do relatório/.test(msg))).toBe(true);
  });
});
