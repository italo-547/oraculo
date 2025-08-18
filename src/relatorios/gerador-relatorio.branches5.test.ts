// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';

vi.mock('../zeladores/util/persistencia.js', () => ({
  salvarEstado: vi.fn(async () => undefined),
}));
vi.mock('../nucleo/constelacao/format.js', () => ({ formatMs: (n: number) => `${n}ms` }));

describe('gerador-relatorio guardian completo', () => {
  it('guardian com status, timestamp e totalArquivos usa valores fornecidos', async () => {
    const { gerarRelatorioMarkdown } = await import('./gerador-relatorio.js');
    const guard = { status: 'ok', timestamp: '2024-01-01T00:00:00Z', totalArquivos: 7 };
    const resultado: any = {
      totalArquivos: 3,
      ocorrencias: [],
      guardian: guard,
      timestamp: Date.now(),
      duracaoMs: 50,
    };
    await gerarRelatorioMarkdown(resultado, 'out.md');
    const { salvarEstado } = await import('../zeladores/util/persistencia.js');
    const conteudo = (salvarEstado as any).mock.calls.at(-1)[1] as string;
    expect(conteudo).toMatch(/Status:\*\* ok/);
    expect(conteudo).toMatch(/Total de arquivos protegidos:\*\* 7/);
  });
});
