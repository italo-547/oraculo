// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../zeladores/util/persistencia.js', () => ({
  salvarEstado: vi.fn(async () => undefined),
}));

// Testes extras para cobrir ramos onde guardian é indefinido ou não possui campos

describe('gerador-relatorio (extra)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gerarRelatorioMarkdown com guardian indefinido usa valores padrão', async () => {
    const { gerarRelatorioMarkdown } = await import('./gerador-relatorio.js');
    const { salvarEstado } = await import('../zeladores/util/persistencia.js');
    const resultado = {
      totalArquivos: 1,
      ocorrencias: [
        { tipo: 't', relPath: 'z.ts', linha: 3, nivel: 'info' as const, mensagem: 'ok' },
      ],
      guardian: undefined,
      timestamp: 1234567890000,
      duracaoMs: 5.2,
      arquivosAnalisados: ['z.ts'],
      fileEntries: [],
    };
    await gerarRelatorioMarkdown(resultado as any, 'out.md');
    const md = (salvarEstado as any).mock.calls[0][1] as string;
    expect(md).toMatch(/não executada/); // status padrão
    expect(md).toMatch(/Total de arquivos protegidos/);
    // placeholders para campos ausentes
    expect(md).toMatch(/—/);
  });

  it('gerarRelatorioMarkdown com guardian parcial usa defaults só nos campos ausentes', async () => {
    const { gerarRelatorioMarkdown } = await import('./gerador-relatorio.js');
    const { salvarEstado } = await import('../zeladores/util/persistencia.js');
    const resultado = {
      totalArquivos: 0,
      ocorrencias: [],
      guardian: { status: 'falha' },
      timestamp: Date.now(),
      duracaoMs: 0,
      arquivosAnalisados: [],
      fileEntries: [],
    };
    await gerarRelatorioMarkdown(resultado as any, 'out2.md');
    const md = (salvarEstado as any).mock.calls[0][1] as string;
    expect(md).toMatch(/falha/);
    // Campos faltantes caem em placeholders
    expect(md).toMatch(/—/);
  });
});
