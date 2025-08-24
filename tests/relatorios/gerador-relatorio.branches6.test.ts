// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';

describe('gerador-relatorio — branches6', () => {
  it('guardian não-objeto: usa defaults para status/timestamp/total', async () => {
    vi.resetModules();
    const saved: any[] = [];
    vi.doMock('../zeladores/util/persistencia.js', () => ({
      salvarEstado: vi.fn(async (p: string, conteudo: unknown) => void saved.push({ p, conteudo })),
    }));
    // mock formatMs para não depender de implementação
    vi.doMock('../nucleo/constelacao/format.js', () => ({ formatMs: (n: number) => `${n}ms` }));

    const { gerarRelatorioMarkdown } = await import('../../src/relatorios/gerador-relatorio.js');
    const resultado = {
      totalArquivos: 2,
      guardian: 'foo',
      timestamp: 1,
      duracaoMs: 5,
      ocorrencias: [
        { relPath: 'b.ts', linha: 2, nivel: 'aviso', mensagem: 'x' },
        { relPath: 'a.ts', linha: 1, nivel: 'erro', mensagem: 'm|n' },
      ],
    } as any;
    await gerarRelatorioMarkdown(resultado, 'out.md');
    expect(saved).toHaveLength(1);
    const md = String(saved[0].conteudo);
    expect(md).toContain('**Status:** não executada');
    expect(md).toContain('**Timestamp:** —');
    expect(md).toContain('**Total de arquivos protegidos:** —');
    // verifica sort por relPath e escape de '|'
    const linhas = md.split('\n').filter((l) => l.startsWith('| '));
    // Cabeçalho + duas linhas
    expect(linhas.length).toBeGreaterThanOrEqual(3);
    const primeiraOcorrencia = linhas[2];
    expect(primeiraOcorrencia).toContain('| a.ts | 1 | erro | m\\|n |');
  });

  it('guardian parcial: apenas timestamp presente', async () => {
    vi.resetModules();
    const saved: any[] = [];
    vi.doMock('../zeladores/util/persistencia.js', () => ({
      salvarEstado: vi.fn(async (p: string, conteudo: unknown) => void saved.push({ p, conteudo })),
    }));
    vi.doMock('../nucleo/constelacao/format.js', () => ({ formatMs: (n: number) => `${n}ms` }));
    const { gerarRelatorioMarkdown } = await import('../../src/relatorios/gerador-relatorio.js');
    const resultado = {
      totalArquivos: 0,
      guardian: { timestamp: 'T' },
      timestamp: 2,
      duracaoMs: 7,
      ocorrencias: [],
    } as any;
    await gerarRelatorioMarkdown(resultado, 'out.md');
    const md = String(saved[0].conteudo);
    expect(md).toContain('**Status:** não executada');
    expect(md).toContain('**Timestamp:** T');
    expect(md).toContain('**Total de arquivos protegidos:** —');
  });

  it('guardian completo: status/timestamp/totalArquivos presentes', async () => {
    vi.resetModules();
    const saved: any[] = [];
    vi.doMock('../zeladores/util/persistencia.js', () => ({
      salvarEstado: vi.fn(async (p: string, conteudo: unknown) => void saved.push({ p, conteudo })),
    }));
    vi.doMock('../nucleo/constelacao/format.js', () => ({ formatMs: (n: number) => `${n}ms` }));
    const { gerarRelatorioMarkdown } = await import('../../src/relatorios/gerador-relatorio.js');
    const resultado = {
      totalArquivos: 0,
      guardian: { status: 'ok', timestamp: 'TS', totalArquivos: 9 },
      timestamp: 3,
      duracaoMs: 9,
      ocorrencias: [],
    } as any;
    await gerarRelatorioMarkdown(resultado, 'out.md');
    const md = String(saved[0].conteudo);
    expect(md).toContain('**Status:** ok');
    expect(md).toContain('**Timestamp:** TS');
    expect(md).toContain('**Total de arquivos protegidos:** 9');
  });
});
