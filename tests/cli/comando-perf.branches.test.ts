// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Command } from 'commander';
import { comandoPerf } from '../../src/cli/comando-perf.js';

describe('comando perf branches', () => {
  it('compare em diretorio com menos de dois snapshots retorna mensagem/erro json', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'oraculo-perf-empty-'));
    const program = new Command();
    program.addCommand(comandoPerf());
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (msg?: unknown) => {
      if (typeof msg === 'string') logs.push(msg);
    };
    try {
      await program.parseAsync(['node', 'oraculo', 'perf', '--json', 'compare', '--dir', dir]);
    } finally {
      console.log = origLog;
    }
    const out = logs.join('\n');
    expect(out).toMatch(/menos de dois snapshots/i);
  });
});
