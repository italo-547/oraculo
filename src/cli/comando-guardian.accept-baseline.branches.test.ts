import { describe, it, expect, vi, beforeEach } from 'vitest';

// Vamos mockar dependências usadas dentro do comando
vi.mock('../nucleo/inquisidor.js', () => ({
  iniciarInquisicao: vi.fn(async () => ({
    fileEntries: [],
    arquivosAnalisados: [],
    timestamp: Date.now(),
    duracaoMs: 1,
  })),
}));

vi.mock('../guardian/sentinela.js', () => ({
  acceptNewBaseline: vi.fn(async () => undefined),
  scanSystemIntegrity: vi.fn(), // não usado neste fluxo
}));

import { comandoGuardian } from './comando-guardian.js';
import { log } from '../nucleo/constelacao/log.js';

// Silencia process.exit para não terminar o runner
const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
  throw new Error('process.exit:' + code);
}) as unknown as typeof process.exit);

describe('comando-guardian accept-baseline branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('--accept-baseline (não json) cobre branch de sucesso', async () => {
    const infoSpy = vi.spyOn(log, 'info').mockImplementation(() => {});
    const sucessoSpy = vi.spyOn(log, 'sucesso').mockImplementation(() => {});

    const cmd = comandoGuardian(() => {});
    await cmd.parseAsync(['node', 'test', 'guardian', '--accept-baseline']);

    expect(infoSpy).toHaveBeenCalled();
    expect(sucessoSpy).toHaveBeenCalledWith(
      expect.stringContaining('baseline de integridade aceito'),
    );
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('--accept-baseline --json cobre branch json', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const sucessoSpy = vi.spyOn(log, 'sucesso').mockImplementation(() => {});

    const cmd = comandoGuardian(() => {});
    await cmd.parseAsync(['node', 'test', 'guardian', '--accept-baseline', '--json']);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('baseline'));
    expect(sucessoSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
