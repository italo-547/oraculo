// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const ORIG = { ...process.env } as Record<string, string | undefined>;

describe('relatorio-zelador-saude – ramos adicionais', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    for (const k of Object.keys(process.env)) delete (process.env as any)[k];
    for (const [k, v] of Object.entries(ORIG)) if (v !== undefined) (process.env as any)[k] = v;
  });

  it('quando não há ocorrências, loga mensagem de sucesso e imprime cabeçalho/rodapé fora do VITEST', async () => {
    // Força ambiente de runtime para pegar molduras de header/footer
    delete (process.env as any).VITEST;
    vi.mock('../nucleo/constelacao/log.js', () => ({
      log: {
        calcularLargura: () => 84,
        imprimirBloco: vi.fn(),
        info: vi.fn(),
        sucesso: vi.fn(),
      },
    }));
    vi.mock('../analistas/analista-padroes-uso.js', () => ({
      estatisticasUsoGlobal: { consts: {}, requires: {} },
    }));
    const { exibirRelatorioZeladorSaude } = await import('./relatorio-zelador-saude.js');
    const { log } = await import('../nucleo/constelacao/log.js');
    exibirRelatorioZeladorSaude([]);
    const titles = (log as any).imprimirBloco.mock.calls.map((c: any[]) => String(c[0])).join('\n');
    expect(titles).toMatch(/Relatório de Saúde do Código/);
    expect(titles).toMatch(/Fim do relatório do zelador/);
    // Mensagem de sem problemas
    const joined =
      (log as any).info.mock.calls.flat().join('\n') +
      '\n' +
      (log as any).sucesso.mock.calls.flat().join('\n');
    expect(joined).toMatch(/Nenhuma função acima do limite/);
  });
});
