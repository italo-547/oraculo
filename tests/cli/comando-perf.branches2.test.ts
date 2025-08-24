// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';

describe('comando perf branches adicionais', () => {
  it('compare early exit não-json (menos de dois snapshots)', async () => {
    vi.doMock('../nucleo/constelacao/log.js', () => ({
      log: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn() },
    }));
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'oraculo-perf-'));
    const { comandoPerf } = await import('../../src/cli/comando-perf.js');
    const program = new Command();
    program.addCommand(comandoPerf());
    await program.parseAsync(['node', 'oraculo', 'perf', 'compare', '--dir', dir]);
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    expect(log.aviso).toHaveBeenCalledWith('Menos de dois snapshots para comparar');
  });

  it('compare sem regressão (JSON) retorna regressao false', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'oraculo-perf-'));
    const anterior = {
      tipo: 'baseline',
      timestamp: new Date(Date.now() - 2000).toISOString(),
      node: process.version,
      tempoParsingMs: 100,
      tempoAnaliseMs: 200,
      hashConteudo: 'hA',
    };
    const atual = {
      tipo: 'baseline',
      timestamp: new Date().toISOString(),
      node: process.version,
      tempoParsingMs: 101,
      tempoAnaliseMs: 202,
      hashConteudo: 'hB',
    };
    await fs.writeFile(path.join(dir, 'baseline-1.json'), JSON.stringify(anterior, null, 2));
    await fs.writeFile(path.join(dir, 'baseline-2.json'), JSON.stringify(atual, null, 2));
    const { comandoPerf } = await import('../../src/cli/comando-perf.js');
    const program = new Command();
    program.addCommand(comandoPerf());
    const saidas: string[] = [];
    const orig = console.log;
    console.log = (m?: unknown) => {
      if (typeof m === 'string') saidas.push(m);
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
        '5',
      ]);
    } finally {
      console.log = orig;
    }
    const out = saidas.join('\n');
    const json = JSON.parse(out);
    expect(json.regressao).toBe(false);
  });
});
