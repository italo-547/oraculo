// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Testa executor cobrindo:
// - Fallback de hash (xxhash lança)
// - Persistência de histórico métricas falhando (catch)
// - Incremental habilitado com reutilização e logging estruturado

describe('executor branches métricas e incremental', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1';
  });

  it('fallback de hash + falha ao salvar histórico métricas + incremental reuse', async () => {
    // Mock xxhash para forçar fallback sha1
    vi.doMock('xxhashjs', () => ({
      h64: () => {
        throw new Error('xxhash indisponível');
      },
    }));
    const salvarCalls: Record<string, any> = {};
    vi.doMock('../zeladores/util/persistencia.js', () => ({
      lerEstado: vi.fn(async (p: string) => salvarCalls[p] ?? null),
      salvarEstado: vi.fn(async (p: string, d: any) => {
        if (p.includes('historico-metricas.json')) throw new Error('falhou salvar historico');
        salvarCalls[p] = d;
      }),
    }));
    const logMock = { info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn() };
    vi.doMock('./constelacao/log.js', () => ({ log: logMock }));
    vi.doMock('./constelacao/format.js', () => ({ formatMs: (n: number) => n + 'ms' }));
    const cfg: any = {
      ANALISE_METRICAS_ENABLED: true,
      ANALISE_METRICAS_HISTORICO_PATH: '.oraculo/historico-metricas/historico-metricas.json',
      ANALISE_METRICAS_HISTORICO_MAX: 5,
      ANALISE_INCREMENTAL_ENABLED: true,
      ANALISE_INCREMENTAL_STATE_PATH: 'incremental.json',
      ANALISE_INCREMENTAL_VERSION: 1,
      LOG_ESTRUTURADO: true,
      DEV_MODE: true,
    };
    vi.doMock('./constelacao/cosmos.js', () => ({ config: cfg }));
    const { executarInquisicao } = await import('./executor.js');
    const tecnicas: any[] = [
      {
        nome: 't1',
        test: () => true,
        aplicar: vi.fn(async () => [
          { mensagem: 'm1', relPath: 'a.ts', tipo: 'x', nivel: 'aviso' },
        ]),
      },
    ];
    const entries = [
      { relPath: 'a.ts', content: 'console.log(1)', ast: {}, fullPath: '/tmp/a.ts' },
      { relPath: 'b.ts', content: 'console.log(2)', ast: {}, fullPath: '/tmp/b.ts' },
    ];
    // Primeira execução (gera estado)
    const r1 = await executarInquisicao(entries as any, tecnicas as any, process.cwd(), null, {
      verbose: false,
      compact: false,
    });
    expect(r1.ocorrencias.length).toBeGreaterThan(0);
    // Segunda execução reaproveita (incremental reuse branch)
    const r2 = await executarInquisicao(entries as any, tecnicas as any, process.cwd(), null, {
      verbose: false,
      compact: false,
    });
    expect(r2.ocorrencias.length).toBeGreaterThan(0);
    // Verifica logging de erro do histórico
    const erroLogs = logMock.erro.mock.calls.map((c) => c[0]).join('\n');
    expect(erroLogs).toMatch(/histórico de métricas/i);
    // Estruturado incremental-salvo
    const infoLogs = logMock.info.mock.calls.map((c) => c[0]).join('\n');
    expect(infoLogs).toMatch(/incremental-salvo/);
  });
});
