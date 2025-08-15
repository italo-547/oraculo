import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exibirRelatorioPadroesUso } from './relatorio-padroes-uso.js';

vi.mock('../nucleo/constelacao/log.js', () => ({
  log: {
    info: vi.fn(),
    sucesso: vi.fn(),
    calcularLargura: vi.fn(() => 84),
    imprimirBloco: vi.fn(),
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

  it('usa imprimirBloco quando não está em ambiente de teste (VITEST indefinido)', async () => {
    const old = process.env.VITEST;
    // Simula ambiente fora do Vitest para cobrir o ramo de moldura
    // Atenção: restaura após execução
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (process.env as any).VITEST;
    try {
      exibirRelatorioPadroesUso();
      expect(log.imprimirBloco).toHaveBeenCalled();
    } finally {
      if (old !== undefined) process.env.VITEST = old;
    }
  });
});
