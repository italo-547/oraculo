import { describe, it, expect } from 'vitest';
import { comandoPerf } from './comando-perf.js';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Command } from 'commander';

describe('comando perf', () => {
  it('gera baseline com métricas globais disponíveis (--json)', async () => {
    (globalThis as any).__ULTIMAS_METRICAS_ORACULO__ = {
      totalArquivos: 10,
      tempoParsingMs: 100,
      tempoAnaliseMs: 250,
      cacheAstHits: 5,
      cacheAstMiss: 5,
      analistas: [
        { nome: 'a', duracaoMs: 12, ocorrencias: 1, global: false },
        { nome: 'b', duracaoMs: 3, ocorrencias: 0, global: true },
      ],
    };
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'oraculo-perf-'));
    const program = new Command();
    program.addCommand(comandoPerf());
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (msg?: unknown) => {
      if (typeof msg === 'string') logs.push(msg);
    };
    try {
      await program.parseAsync(['node', 'oraculo', 'perf', '--json', 'baseline', '--dir', dir]);
    } finally {
      console.log = origLog;
    }
    const out = logs.join('\n');
    expect(out).toMatch(/"gerado"/);
    const arquivos = await fs.readdir(dir);
    expect(arquivos.some((f) => f.startsWith('baseline-') && f.endsWith('.json'))).toBe(true);
  });

  it('compara dois snapshots e detecta regressão acima do limite', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'oraculo-perf-'));
    const anterior = {
      tipo: 'baseline',
      timestamp: new Date(Date.now() - 1000).toISOString(),
      node: process.version,
      tempoParsingMs: 100,
      tempoAnaliseMs: 200,
      hashConteudo: 'hashAnterior',
    };
    await fs.writeFile(path.join(dir, 'baseline-1.json'), JSON.stringify(anterior, null, 2));
    const atual = {
      tipo: 'baseline',
      timestamp: new Date().toISOString(),
      node: process.version,
      tempoParsingMs: 150,
      tempoAnaliseMs: 280,
      hashConteudo: 'hashAtual',
    };
    await fs.writeFile(path.join(dir, 'baseline-2.json'), JSON.stringify(atual, null, 2));

    const program = new Command();
    program.addCommand(comandoPerf());
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (msg?: unknown) => {
      if (typeof msg === 'string') logs.push(msg);
    };
    try {
      await program.parseAsync([
        'node',
        'oraculo',
        'perf',
        '--json',
        'compare',
        '--dir',
        dir,
        '--limite',
        '30',
      ]);
    } finally {
      console.log = origLog;
    }
    const out = logs.join('\n');
    expect(out).toMatch(/"regressao"/);
    const json = JSON.parse(out);
    expect(json.regressao).toBe(true);
  });
});
