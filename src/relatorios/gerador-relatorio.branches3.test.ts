import { describe, it, expect, vi } from 'vitest';

vi.mock('../zeladores/util/persistencia.js', () => ({
  salvarEstado: vi.fn(async () => undefined),
}));
vi.mock('../nucleo/constelacao/format.js', () => ({ formatMs: (n: number) => `${n}ms` }));

describe('gerador-relatorio markdown branches extra', () => {
  it('guardian malformado (obj sem campos) usa valores fallback', async () => {
    const { gerarRelatorioMarkdown } = await import('./gerador-relatorio.js');
    const resultado: any = {
      totalArquivos: 2,
      ocorrencias: [],
      guardian: { qualquer: 'valor' }, // sem status/timestamp/totalArquivos
      timestamp: Date.now(),
      duracaoMs: 1234,
    };
    await gerarRelatorioMarkdown(resultado, 'saida.md');
    const { salvarEstado } = await import('../zeladores/util/persistencia.js');
    const conteudo = (salvarEstado as any).mock.calls[0][1] as string;
    expect(conteudo).toMatch(/\*\*Status:\*\* não executada/);
    expect(conteudo).toMatch(/\*\*Timestamp:\*\* —/);
    expect(conteudo).toMatch(/\*\*Total de arquivos protegidos:\*\* —/);
  });
});
