import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as gerador from './gerador-relatorio.js';

vi.mock('../zeladores/util/persistencia.js', () => ({
  salvarEstado: vi.fn(async () => undefined),
}));

describe('gerador-relatorio', () => {
  const resultadoMock = {
    totalArquivos: 2,
    ocorrencias: [
      { tipo: 'teste', relPath: 'a.ts', linha: 1, nivel: 'erro' as const, mensagem: 'msg1' },
      { tipo: 'teste', relPath: 'b.ts', linha: 2, nivel: 'aviso' as const, mensagem: 'msg2' },
    ],
    guardian: { status: 'ok', timestamp: 123, totalArquivos: 2 },
    timestamp: 1234567890000,
    duracaoMs: 10.5,
    arquivosAnalisados: ['a.ts', 'b.ts'],
    fileEntries: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gerarRelatorioMarkdown chama salvarEstado com markdown', async () => {
    const { salvarEstado } = await import('../zeladores/util/persistencia.js');
    await gerador.gerarRelatorioMarkdown(resultadoMock, 'saida.md');
    expect(salvarEstado).toHaveBeenCalled();
    const md = (salvarEstado as any).mock.calls[0][1];
    expect(md).toContain('#');
    expect(md).toContain('Relatório Oráculo');
    expect(md).toContain('a.ts');
    expect(md).toContain('msg1');
  });

  it('gerarRelatorioJson chama salvarEstado com json', async () => {
    const { salvarEstado } = await import('../zeladores/util/persistencia.js');
    await gerador.gerarRelatorioJson(resultadoMock, 'saida.json');
    expect(salvarEstado).toHaveBeenCalledWith('saida.json', resultadoMock);
  });
});
