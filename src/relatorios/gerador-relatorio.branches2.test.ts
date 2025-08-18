// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';

vi.mock('../zeladores/util/persistencia.js', () => ({
  salvarEstado: vi.fn(async () => undefined),
}));

describe('gerador-relatorio (guardian ausente)', () => {
  it('usa valores default quando guardian ausente', async () => {
    const { gerarRelatorioMarkdown } = await import('./gerador-relatorio.js');
    const { salvarEstado } = await import('../zeladores/util/persistencia.js');
    const resultado = {
      totalArquivos: 1,
      ocorrencias: [],
      guardian: undefined,
      timestamp: Date.now(),
      duracaoMs: 5,
      arquivosAnalisados: [],
      fileEntries: [],
    } as any;
    await gerarRelatorioMarkdown(resultado, 'out.md');
    const md = (salvarEstado as any).mock.calls[0][1] as string;
    // Linha contém dois espaços antes do hífen conforme template
    expect(md).toMatch(/\*\*Status:\*\* não executada/);
  });
});
