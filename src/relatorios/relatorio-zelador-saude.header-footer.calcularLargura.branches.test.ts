// SPDX-License-Identifier: MIT
import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';

const ORIG: Record<string, string | undefined> = { ...process.env } as any;

describe('relatorio-zelador-saude – cabeçalho/rodapé com calcularLargura presente', () => {
  beforeEach(() => {
    vi.resetModules();
    delete (process.env as any).VITEST; // força molduras de cabeçalho/rodapé
  });
  afterEach(() => {
    vi.restoreAllMocks();
    for (const k of Object.keys(process.env)) delete (process.env as any)[k];
    for (const [k, v] of Object.entries(ORIG)) if (v !== undefined) (process.env as any)[k] = v;
  });

  it('quando calcularLargura existe, imprime molduras com largura calculada', async () => {
    vi.mock('../nucleo/constelacao/log.js', () => {
      const imprimirBloco = vi.fn();
      const calcularLargura = vi.fn(() => 88); // devolve um número para o caminho com largura
      const info = vi.fn();
      const sucesso = vi.fn();
      return { log: { imprimirBloco, calcularLargura, info, sucesso } };
    });
    vi.mock('../analistas/analista-padroes-uso.js', () => ({
      estatisticasUsoGlobal: { consts: {}, requires: {} },
    }));
    const { exibirRelatorioZeladorSaude } = await import('./relatorio-zelador-saude.js');
    const { log } = await import('../nucleo/constelacao/log.js');
    exibirRelatorioZeladorSaude([]);
    // Deve ter chamado imprimirBloco duas vezes: cabeçalho e rodapé
    expect((log as any).imprimirBloco).toHaveBeenCalled();
    const widths = (log as any).imprimirBloco.mock.calls.map((c: any[]) => c[3]);
    // largura calculada (88) deve ser usada pelo menos uma vez
    expect(widths).toContain(88);
  });
});
