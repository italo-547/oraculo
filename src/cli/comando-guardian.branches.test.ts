// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { comandoGuardian } from './comando-guardian.js';

process.env.VITEST = '1';

vi.mock('../nucleo/inquisidor.js', () => ({
  iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
}));

const scanSpy = vi.fn(async () => ({ status: 'ok' }));
const acceptSpy = vi.fn(async () => {});
vi.mock('../guardian/sentinela.js', () => ({
  scanSystemIntegrity: () => scanSpy(),
  acceptNewBaseline: () => acceptSpy(),
}));

function buildCLI() {
  const program = new Command();
  program.addCommand(comandoGuardian(() => {}));
  return program;
}

beforeEach(() => {
  scanSpy.mockReset().mockResolvedValue({ status: 'ok' });
  acceptSpy.mockReset();
});

describe('comando-guardian branches', () => {
  it('--json ok', async () => {
    const cli = buildCLI();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await cli.parseAsync(['node', 'cli', 'guardian', '--json']);
    const out = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(out).toMatch(/"status":"ok"/);
    logSpy.mockRestore();
  });

  it('--diff com alteracoes gera exit code 1 (simulado) e json', async () => {
    scanSpy.mockResolvedValueOnce({ status: 'alteracoes-detectadas', detalhes: ['x'] } as any);
    const cli = buildCLI();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error('exit:' + code);
    }) as any);
    try {
      await cli.parseAsync(['node', 'cli', 'guardian', '--diff', '--json']);
    } catch (e: any) {
      expect(e.message).toBe('exit:1');
    }
    const out = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(out).toMatch(/alteracoes-detectadas/);
    logSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('--accept-baseline em modo proibido full-scan retorna exit 1', async () => {
    const cli = buildCLI();
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error('exit:' + code);
    }) as any);
    try {
      await cli.parseAsync(['node', 'cli', 'guardian', '--accept-baseline', '--full-scan']);
    } catch (e: any) {
      expect(e.message).toBe('exit:1');
    }
    exitSpy.mockRestore();
  });
});
