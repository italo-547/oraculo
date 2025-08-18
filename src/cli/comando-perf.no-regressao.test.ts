// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('comando perf sem regressão', () => {
  it('compara snapshots e não detecta regressão (saída não-JSON)', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'oraculo-perf-'));
    const anterior = {
      tipo: 'baseline',
      timestamp: new Date(Date.now() - 2000).toISOString(),
      node: process.version,
      tempoParsingMs: 100,
      tempoAnaliseMs: 200,
      hashConteudo: 'oldhash',
    };
    const atual = {
      tipo: 'baseline',
      timestamp: new Date().toISOString(),
      node: process.version,
      tempoParsingMs: 105,
      tempoAnaliseMs: 202,
      hashConteudo: 'newhash',
    };
    await fs.writeFile(path.join(dir, 'baseline-1.json'), JSON.stringify(anterior, null, 2));
    await fs.writeFile(path.join(dir, 'baseline-2.json'), JSON.stringify(atual, null, 2));

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
    await program.parseAsync(['node', 'cli', 'perf', 'compare', '--dir', dir, '--limite', '30']);
    expect(infoLogs.some((l) => l.includes('Comparação entre snapshots'))).toBe(true);
    expect(sucessoLogs.some((l) => l.includes('Sem regressões'))).toBe(true);
    expect(avisoLogs.length).toBe(0);
  });
});
