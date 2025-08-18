// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { comandoPerf } from './comando-perf.js';

function buildSnapshot(partial: any): any {
  return {
    tipo: 'baseline',
    timestamp: new Date().toISOString(),
    node: 'vX',
    ...partial,
  };
}

async function writeSnapshot(dir: string, snap: any) {
  await fs.mkdir(dir, { recursive: true });
  const name = `baseline-${Date.now()}-${Math.random().toString(16).slice(2)}.json`;
  await fs.writeFile(path.join(dir, name), JSON.stringify(snap, null, 2), 'utf-8');
}

describe('comando-perf diffPercent branches', () => {
  const baseTmp = path.join(process.cwd(), 'tmp-perf-diff');
  beforeEach(async () => {
    await fs.rm(baseTmp, { recursive: true, force: true });
  });

  it('cobre branches: (!a && !b) e (!a || !b)', async () => {
    const dir1 = path.join(baseTmp, 'c1');
    // ambos undefined => (!a && !b)
    await writeSnapshot(dir1, buildSnapshot({}));
    await new Promise((r) => setTimeout(r, 5));
    await writeSnapshot(dir1, buildSnapshot({}));
    let out = '';
    const spy = vi.spyOn(console, 'log').mockImplementation((m: string) => {
      out += m;
    });
    await comandoPerf().parseAsync(['node', 'perf', 'compare', '-d', dir1, '--json']);
    spy.mockRestore();
    const json1 = JSON.parse(out);
    expect(json1.diffs.every((d: any) => d.variacaoPct === 0)).toBe(true);

    // a undefined, b definido => (!a || !b)
    const dir2 = path.join(baseTmp, 'c2');
    await writeSnapshot(dir2, buildSnapshot({}));
    await new Promise((r) => setTimeout(r, 5));
    await writeSnapshot(
      dir2,
      buildSnapshot({
        tempoParsingMs: 10,
        tempoAnaliseMs: 5,
        cacheAstHits: 1,
        cacheAstMiss: 0,
        totalArquivos: 2,
      }),
    );
    out = '';
    const spy2 = vi.spyOn(console, 'log').mockImplementation((m: string) => {
      out += m;
    });
    await comandoPerf().parseAsync(['node', 'perf', 'compare', '-d', dir2, '--json']);
    spy2.mockRestore();
    const json2 = JSON.parse(out);
    expect(json2.diffs.every((d: any) => d.variacaoPct === 0)).toBe(true); // retorna 0 pois branch (!a || !b)
  });

  it('cobre branch cálculo final (todos definidos) com variacaoPct != 0', async () => {
    const dir3 = path.join(baseTmp, 'c3');
    await writeSnapshot(
      dir3,
      buildSnapshot({
        tempoParsingMs: 10,
        tempoAnaliseMs: 10,
        cacheAstHits: 1,
        cacheAstMiss: 1,
        totalArquivos: 10,
      }),
    );
    await new Promise((r) => setTimeout(r, 5));
    await writeSnapshot(
      dir3,
      buildSnapshot({
        tempoParsingMs: 15,
        tempoAnaliseMs: 5,
        cacheAstHits: 2,
        cacheAstMiss: 1,
        totalArquivos: 12,
      }),
    );
    let out = '';
    const spy = vi.spyOn(console, 'log').mockImplementation((m: string) => {
      out += m;
    });
    await comandoPerf().parseAsync(['node', 'perf', 'compare', '-d', dir3, '--json']);
    spy.mockRestore();
    const json = JSON.parse(out);
    const parsingDiff = json.diffs.find((d: any) => d.campo === 'tempoParsingMs');
    expect(parsingDiff.variacaoPct).toBeGreaterThan(0); // cálculo executado
  });

  it('cobre branch a===0 retornando 0', async () => {
    const dir4 = path.join(baseTmp, 'c4');
    await writeSnapshot(
      dir4,
      buildSnapshot({
        tempoParsingMs: 0,
        tempoAnaliseMs: 0,
        cacheAstHits: 0,
        cacheAstMiss: 0,
        totalArquivos: 0,
      }),
    );
    await new Promise((r) => setTimeout(r, 5));
    await writeSnapshot(
      dir4,
      buildSnapshot({
        tempoParsingMs: 5,
        tempoAnaliseMs: 10,
        cacheAstHits: 1,
        cacheAstMiss: 2,
        totalArquivos: 3,
      }),
    );
    let out = '';
    const spy = vi.spyOn(console, 'log').mockImplementation((m: string) => {
      out += m;
    });
    await comandoPerf().parseAsync(['node', 'perf', 'compare', '-d', dir4, '--json']);
    spy.mockRestore();
    const json = JSON.parse(out);
    const parsingDiff = json.diffs.find((d: any) => d.campo === 'tempoParsingMs');
    expect(parsingDiff.variacaoPct).toBe(0); // branch a===0
  });
});
