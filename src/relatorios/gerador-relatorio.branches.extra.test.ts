// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';
import { gerarRelatorioMarkdown } from './gerador-relatorio.js';

vi.mock('../zeladores/util/persistencia.js', () => ({
  salvarEstado: vi.fn(async () => undefined),
}));

describe('gerador-relatorio branches extras', () => {
  it('gera markdown escapando pipes e guardian ausente', async () => {
    const resultado: any = {
      totalArquivos: 1,
      ocorrencias: [
        { relPath: 'a|b.ts', linha: 1, nivel: 'aviso', mensagem: 'msg | teste' },
        { relPath: 'a.ts', linha: 2, nivel: 'erro', mensagem: 'outra' },
      ],
      guardian: undefined,
      timestamp: Date.now(),
      duracaoMs: 12.3456,
    };
    const { salvarEstado } = await import('../zeladores/util/persistencia.js');
    await gerarRelatorioMarkdown(resultado, 'out.md');
    const chamado = (salvarEstado as any).mock.calls[0][1] as string;
    expect(chamado).toMatch(/a\|b.ts/);
    expect(chamado).toMatch(/msg \\| teste/);
    expect(chamado).toMatch(/não executada|não executada/i);
  });
});
