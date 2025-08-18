// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';

vi.mock('../zeladores/util/persistencia.js', () => ({
  salvarEstado: vi.fn(async () => undefined),
}));
vi.mock('../nucleo/constelacao/format.js', () => ({ formatMs: (n: number) => `${n}ms` }));

describe('gerador-relatorio markdown fallback adicionais', () => {
  it('guardian string usa fallback', async () => {
    const { gerarRelatorioMarkdown } = await import('./gerador-relatorio.js');
    const resultado: any = {
      totalArquivos: 1,
      ocorrencias: [],
      guardian: 'ok',
      timestamp: Date.now(),
      duracaoMs: 10,
    };
    await gerarRelatorioMarkdown(resultado, 'x.md');
    const { salvarEstado } = await import('../zeladores/util/persistencia.js');
    const conteudo = (salvarEstado as any).mock.calls[0][1] as string;
    expect(conteudo).toMatch(/\*\*Status:\*\* não executada/);
  });

  it('guardian null usa fallback', async () => {
    const { gerarRelatorioMarkdown } = await import('./gerador-relatorio.js');
    const resultado: any = {
      totalArquivos: 0,
      ocorrencias: [],
      guardian: null,
      timestamp: Date.now(),
      duracaoMs: 5,
    };
    await gerarRelatorioMarkdown(resultado, 'y.md');
    const { salvarEstado } = await import('../zeladores/util/persistencia.js');
    const conteudo = (salvarEstado as any).mock.calls[1][1] as string;
    expect(conteudo).toMatch(/\*\*Timestamp:\*\* —/);
  });
});
