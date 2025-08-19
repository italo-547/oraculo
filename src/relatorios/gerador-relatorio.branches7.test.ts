// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';

describe('gerador-relatorio — branches7 (json + ordenação por linha)', () => {
  it('gerarRelatorioJson chama salvarEstado com o objeto bruto', async () => {
    vi.resetModules();
    const saved: any[] = [];
    vi.doMock('../zeladores/util/persistencia.js', () => ({
      salvarEstado: vi.fn(async (p: string, conteudo: unknown) => void saved.push({ p, conteudo })),
    }));
    const { gerarRelatorioJson } = await import('./gerador-relatorio.js');
    const r = { totalArquivos: 1, ocorrencias: [{ relPath: 'a', linha: 2 }], timestamp: 0 } as any;
    await gerarRelatorioJson(r, 'out.json');
    expect(saved).toHaveLength(1);
    expect(saved[0].p).toBe('out.json');
    expect(saved[0].conteudo).toBe(r);
  });

  it('ordenar por relPath e desempatar por linha crescente', async () => {
    vi.resetModules();
    const saved: any[] = [];
    vi.doMock('../zeladores/util/persistencia.js', () => ({
      salvarEstado: vi.fn(async (p: string, conteudo: unknown) => void saved.push({ p, conteudo })),
    }));
    vi.doMock('../nucleo/constelacao/format.js', () => ({ formatMs: (n: number) => `${n}ms` }));
    const { gerarRelatorioMarkdown } = await import('./gerador-relatorio.js');
    const resultado = {
      totalArquivos: 1,
      timestamp: 0,
      duracaoMs: 1,
      guardian: undefined,
      ocorrencias: [
        { relPath: 'a.ts', linha: 10, nivel: 'a', mensagem: 'A' },
        { relPath: 'a.ts', linha: 2, nivel: 'b', mensagem: 'B' },
        { relPath: 'b.ts', linha: 1, nivel: 'c', mensagem: 'C' },
      ],
    } as any;
    await gerarRelatorioMarkdown(resultado, 'out.md');
    const md = String(saved[0].conteudo);
    const ocorrRows = md
      .split('\n')
      .map((l) => /\|\s([^|]+)\s\|\s(\d+)/.exec(l))
      .filter((m): m is RegExpExecArray => !!m);
    // Deve vir a.ts linha 2 antes de a.ts linha 10, e b.ts depois
    const ordem = ocorrRows.map((m) => `${m[1]}:${m[2]}`);
    expect(ordem[0]).toBe('a.ts:2');
    expect(ordem[1]).toBe('a.ts:10');
    expect(ordem[2]).toBe('b.ts:1');
  });
});
