// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/zeladores/util/persistencia.js', () => ({
  salvarEstado: vi.fn(async () => undefined),
}));

describe('gerador-relatorio (empty casos)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('markdown com zero ocorrencias gera só tabela sem linhas de dados', async () => {
    const { gerarRelatorioMarkdown } = await import('../../src/relatorios/gerador-relatorio.js');
    const { salvarEstado } = await import('../../src/zeladores/util/persistencia.js');
    const resultado = {
      totalArquivos: 0,
      ocorrencias: [],
      guardian: { timestamp: 111, totalArquivos: 0 },
      timestamp: Date.now(),
      duracaoMs: 0,
      arquivosAnalisados: [],
      fileEntries: [],
    };
    await gerarRelatorioMarkdown(resultado as any, 'out.md');
    const md = (salvarEstado as any).mock.calls[0][1] as string;
    const linhasTabela = md.split('\n').filter((l) => /^\| /.test(l));
    // Deve ter header e separador apenas (2 linhas) sem dados adicionais
    expect(linhasTabela.length).toBe(2);
    expect(linhasTabela.every((l) => !/\| info \|/.test(l))).toBe(true);
  });
});
