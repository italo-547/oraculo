import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Cobre branch de commit presente (obterCommit bem-sucedido) no baseline não-JSON
describe('comando perf baseline commit branch', () => {
  it('loga baseline com commit presente', async () => {
    // mock child_process para retornar commit
    vi.doMock('node:child_process', () => ({
      execSync: () => Buffer.from('abc123\n'),
    }));
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'oraculo-perf-commit-'));
    const sucesso: string[] = [];
    vi.doMock('../nucleo/constelacao/log.js', () => ({
      log: {
        info: vi.fn(),
        aviso: vi.fn(),
        erro: vi.fn(),
        sucesso: (m: string) => sucesso.push(m),
      },
    }));
    const { comandoPerf } = await import('./comando-perf.js');
    const program = new Command();
    program.addCommand(comandoPerf());
    await program.parseAsync(['node', 'cli', 'perf', 'baseline', '--dir', dir]);
    expect(sucesso.some((m) => /commit=abc123/.test(m))).toBe(true);
  });
});
