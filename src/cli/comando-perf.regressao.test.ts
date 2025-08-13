import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Este arquivo amplia cobertura de branches em comando-perf:
//  - comando perf baseline --json
//  - comando perf compare com regressão (log.aviso)
//  - campos de métricas ausentes (diffPercent early returns)

describe('comando perf regressão & baseline json', () => {
  it('gera baseline em modo json usando métricas globais', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'oraculo-perf-base-'));
    // injeta métricas globais simuladas para caminho de analistasTop e hash
    (globalThis as any).__ULTIMAS_METRICAS_ORACULO__ = {
      totalArquivos: 3,
      tempoParsingMs: 10,
      tempoAnaliseMs: 25,
      cacheAstHits: 1,
      cacheAstMiss: 2,
      analistas: [
        { nome: 'a', duracaoMs: 5, ocorrencias: 1 },
        { nome: 'b', duracaoMs: 10, ocorrencias: 2 },
        { nome: 'c', duracaoMs: 1, ocorrencias: 1 },
      ],
    };
    const out: string[] = [];
    const origLog = console.log;
    console.log = (m?: unknown) => {
      if (typeof m === 'string') out.push(m);
    };
    try {
      const { comandoPerf } = await import('./comando-perf.js');
      const program = new Command();
      program.addCommand(comandoPerf());
      await program.parseAsync(['node', 'cli', 'perf', '--json', 'baseline', '--dir', dir]);
    } finally {
      console.log = origLog;
    }
    const texto = out.join('\n');
    expect(texto).toMatch(/"gerado": true/);
    expect(texto).toMatch(/"snapshot"/);
  });

  it('detecta regressão (non-json) e cobre diffPercent com métricas ausentes', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'oraculo-perf-reg-'));
    // Snapshot anterior possui apenas alguns campos
    const anterior = {
      tipo: 'baseline',
      timestamp: new Date(Date.now() - 5000).toISOString(),
      node: process.version,
      tempoParsingMs: 100, // campo presente
      // tempoAnaliseMs ausente propositalmente
      // demais campos ausentes para gerar combinações undefined/undefined
      hashConteudo: 'old',
    };
    const atual = {
      tipo: 'baseline',
      timestamp: new Date().toISOString(),
      node: process.version,
      tempoParsingMs: 160, // +60% (> limite 20%) => regressão
      tempoAnaliseMs: 50, // passa a existir (anterior undefined)
      cacheAstHits: 5,
      totalArquivos: 10,
      hashConteudo: 'new',
    } as const;
    await fs.writeFile(path.join(dir, 'baseline-1.json'), JSON.stringify(anterior, null, 2));
    await fs.writeFile(path.join(dir, 'baseline-2.json'), JSON.stringify(atual, null, 2));

    // Garantir que o cache do módulo seja limpo para aplicar mock
    vi.resetModules();
    const infoLogs: string[] = [];
    const avisoLogs: string[] = [];
    const sucessoLogs: string[] = [];
    vi.doMock('../nucleo/constelacao/log.js', () => ({
      log: {
        info: (m: string) => infoLogs.push(m),
        aviso: (m: string) => avisoLogs.push(m),
        sucesso: (m: string) => sucessoLogs.push(m),
        erro: () => undefined,
        debug: () => undefined,
      },
    }));
    const { comandoPerf } = await import('./comando-perf.js');
    const program = new Command();
    program.addCommand(comandoPerf());
    await program.parseAsync(['node', 'cli', 'perf', 'compare', '--dir', dir, '--limite', '20']);
    // Pode ou não capturar via mock dependendo de interações anteriores; aceitar qualquer um
    const temComparacao = infoLogs.some((l) => /Comparação entre snapshots/i.test(l));
    expect(temComparacao || avisoLogs.length > 0).toBe(true);
    // Regressão detectada => aviso
    expect(avisoLogs.some((l) => /Regressão acima/i.test(l))).toBe(true);
    // Não deve haver sucesso para este cenário
    expect(sucessoLogs.length).toBe(0);
  });
});
