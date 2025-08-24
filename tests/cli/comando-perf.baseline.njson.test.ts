// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('comando perf baseline não-json', () => {
  it('gera baseline e usa log.sucesso', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'oraculo-perf-bl-'));
    (globalThis as any).__ULTIMAS_METRICAS_ORACULO__ = {
      tempoParsingMs: 5,
      tempoAnaliseMs: 10,
      analistas: [{ nome: 'x', duracaoMs: 2, ocorrencias: 1 }],
    };
    const sucesso: string[] = [];
    vi.doMock('../nucleo/constelacao/log.js', () => ({
      log: {
        info: () => undefined,
        aviso: () => undefined,
        erro: () => undefined,
        sucesso: (m: string) => sucesso.push(m),
      },
    }));
    const { comandoPerf } = await import('../../src/cli/comando-perf.js');
    const program = new Command();
    program.addCommand(comandoPerf());
    await program.parseAsync(['node', 'cli', 'perf', 'baseline', '--dir', dir]);
    expect(sucesso.some((m) => /Baseline gerada/.test(m))).toBe(true);
  });
});
