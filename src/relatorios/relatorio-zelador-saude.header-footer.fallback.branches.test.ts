import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';

const ORIG: Record<string, string | undefined> = { ...process.env } as any;

describe('relatorio-zelador-saude – fallback de largura no cabeçalho/rodapé', () => {
  beforeEach(() => {
    vi.resetModules();
    delete (process.env as any).VITEST; // força molduras
  });
  afterEach(() => {
    vi.restoreAllMocks();
    for (const k of Object.keys(process.env)) delete (process.env as any)[k];
    for (const [k, v] of Object.entries(ORIG)) if (v !== undefined) (process.env as any)[k] = v;
  });

  it('quando calcularLargura não existe, ainda imprime molduras com imprimirBloco', async () => {
    vi.mock('../nucleo/constelacao/log.js', () => {
      const imprimirBloco = vi.fn();
      const info = vi.fn();
      const sucesso = vi.fn();
      return { log: { imprimirBloco, info, sucesso } };
    });
    vi.mock('../analistas/analista-padroes-uso.js', () => ({
      estatisticasUsoGlobal: { consts: {}, requires: {} },
    }));
    const { exibirRelatorioZeladorSaude } = await import('./relatorio-zelador-saude.js');
    const { log } = await import('../nucleo/constelacao/log.js');
    exibirRelatorioZeladorSaude([]);
    const titles = (log.imprimirBloco as any).mock.calls.map((c: any[]) => String(c[0])).join('\n');
    expect(titles).toMatch(/Relatório de Saúde do Código/);
    expect(titles).toMatch(/Fim do relatório do zelador/);
  });
});
