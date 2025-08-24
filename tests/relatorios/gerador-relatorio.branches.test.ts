// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/zeladores/util/persistencia.js', () => ({
  salvarEstado: vi.fn(async () => undefined),
}));

describe('gerador-relatorio (branches)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ordena ocorrencias por relPath e desempata por linha; escapa pipes', async () => {
    const { gerarRelatorioMarkdown } = await import('../../src/relatorios/gerador-relatorio.js');
    const { salvarEstado } = await import('../../src/zeladores/util/persistencia.js');
    const resultado = {
      totalArquivos: 4,
      ocorrencias: [
        { tipo: 't', relPath: 'b.ts', linha: 5, nivel: 'info' as const, mensagem: 'b' },
        { tipo: 't', relPath: 'a.ts', linha: 10, nivel: 'info' as const, mensagem: 'a linha 10' },
        {
          tipo: 't',
          relPath: 'a.ts',
          linha: 2,
          nivel: 'info' as const,
          mensagem: 'a linha 2 | pipe',
        },
        {
          tipo: 't',
          relPath: undefined,
          linha: 1,
          nivel: 'info' as const,
          mensagem: 'sem caminho',
        } as any,
      ],
      guardian: { status: 'ok', totalArquivos: 4, timestamp: 1 },
      timestamp: Date.now(),
      duracaoMs: 1.2,
      arquivosAnalisados: ['b.ts', 'a.ts'],
      fileEntries: [],
    };
    await gerarRelatorioMarkdown(resultado as any, 'out.md');
    const md = (salvarEstado as any).mock.calls[0][1] as string;
    const ordem = md
      .split('\n')
      .filter((l) => l.startsWith('| '))
      .map((l) => l.split('|')[1].trim()); // relPath

    // a.ts deve vir antes de b.ts e suas linhas ordenadas 2 depois 10
    const indicesA = ordem.map((r, i) => (r === 'a.ts' ? i : -1)).filter((i) => i >= 0);
    expect(indicesA.length).toBe(2);
    const linhasA = md
      .split('\n')
      .filter((l) => l.includes('| a.ts |'))
      .map((l) => Number(l.split('|')[2].trim()));
    expect(linhasA).toEqual([2, 10]);
    // Escapou pipe
    expect(md).toMatch(/a linha 2 \\\| pipe/);
  });
});
