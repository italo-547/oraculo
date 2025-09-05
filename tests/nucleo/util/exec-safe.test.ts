import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('executarShellSeguro', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('deve bloquear exec quando SAFE_MODE ativo e ALLOW_EXEC=false', async () => {
    // import config and set flags before importing helper
    const { config: cfg } = await import('../../../src/nucleo/constelacao/cosmos.js');
    cfg.SAFE_MODE = true;
    cfg.ALLOW_EXEC = false;
    // import helper after config set
    const mod = await import('../../../src/nucleo/util/exec-safe.js');
    const { executarShellSeguro } = mod;
    expect(() => executarShellSeguro('echo hi')).toThrow(/Execução de comandos desabilitada/);
  });

  it('deve delegar para child_process.execSync quando permitido', async () => {
    // set flags
    const { config: cfg } = await import('../../../src/nucleo/constelacao/cosmos.js');
    cfg.SAFE_MODE = true;
    cfg.ALLOW_EXEC = true;
    // mock child_process.execSync via vi.doMock before importing helper
    const mockExec = vi.fn(() => Buffer.from('ok'));
    vi.doMock('node:child_process', () => ({ execSync: mockExec }));
    // import helper after mocking
    const mod = await import('../../../src/nucleo/util/exec-safe.js');
    const { executarShellSeguro } = mod;
    const res = executarShellSeguro('echo ok');
    expect(mockExec).toHaveBeenCalled();
    expect(res.toString()).toBe('ok');
  });
});
