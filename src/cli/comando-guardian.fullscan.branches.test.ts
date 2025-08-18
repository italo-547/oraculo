// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { comandoGuardian } from './comando-guardian.js';

process.env.VITEST = '1';

// Cobre branches restantes: execução padrão com --full-scan (sem accept) status ok,
// diff em full-scan sem alterações e erro em modo --json.

const scanSpy = vi.fn(async () => ({ status: 'ok' }));

vi.mock('../nucleo/inquisidor.js', () => ({
  iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
}));

vi.mock('../guardian/sentinela.js', () => ({
  // Evita spread que gerou erro de tipo
  scanSystemIntegrity: () => scanSpy(),
  acceptNewBaseline: vi.fn(async () => {}),
}));

function build() {
  const p = new Command();
  p.addCommand(comandoGuardian(() => {}));
  return p;
}

describe('comando-guardian full-scan branches', () => {
  beforeEach(() => {
    scanSpy.mockReset().mockResolvedValue({ status: 'ok' });
  });

  it('executa verificação com --full-scan sem persistir baseline', async () => {
    const cli = build();
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      if (code !== undefined) throw new Error('exit:' + code);
      throw new Error('exit');
    }) as any);
    await cli.parseAsync(['node', 'cli', 'guardian', '--full-scan']);
    // status ok sem exit code forçado
    expect(exitSpy).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });

  it('--full-scan com --diff e sem alterações mantém exit 0', async () => {
    scanSpy.mockResolvedValueOnce({ status: 'ok', detalhes: [] } as any);
    const cli = build();
    await cli.parseAsync(['node', 'cli', 'guardian', '--full-scan', '--diff']);
    // Sem throw significa exit 0
  });

  it('erro em modo --json emite status erro', async () => {
    scanSpy.mockImplementationOnce(() => {
      throw new Error('falhou sentinel');
    });
    const cli = build();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error('exit:' + code);
    }) as any);
    try {
      await cli.parseAsync(['node', 'cli', 'guardian', '--json']);
    } catch (e: any) {
      expect(e.message).toBe('exit:1');
    }
    const out = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(out).toMatch(/"status":"erro"/);
    logSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
