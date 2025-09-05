// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { log } from '../../src/nucleo/constelacao/log.js';
import { config } from '../../src/nucleo/constelacao/cosmos.js';

vi.mock('../../src/nucleo/constelacao/cosmos.js', () => ({
  config: {
    REPORT_SILENCE_LOGS: false,
    DEV_MODE: false,
  },
}));
vi.mock('chalk', () => {
  const fn = (s: string) => s;
  (fn as any).gray = fn;
  (fn as any).cyan = fn;
  (fn as any).green = fn;
  (fn as any).red = fn;
  (fn as any).yellow = fn;
  (fn as any).magenta = fn;
  (fn as any).bold = fn;
  return { default: fn };
});

describe('log util', () => {
  let originalEnv: NodeJS.ProcessEnv;
  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.restoreAllMocks();
  });
  afterEach(() => {
    process.env = originalEnv;
  });

  it('log.info imprime mensagem se não silenciado', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    log.info('mensagem');
    expect(spy).toHaveBeenCalled();
  });

  it('log.sucesso imprime mensagem se não silenciado', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    log.sucesso('ok');
    expect(spy).toHaveBeenCalled();
  });

  it('log.erro sempre imprime no console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    log.erro('deu ruim');
    expect(spy).toHaveBeenCalled();
  });

  it('log.aviso imprime mensagem se não silenciado', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    log.aviso('atenção');
    expect(spy).toHaveBeenCalled();
  });

  it('log.debug só imprime se DEV_MODE ou ORACULO_DEBUG', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // Não imprime por padrão
    log.debug('debug1');
    expect(spy).not.toHaveBeenCalled();
    // Ativa DEV_MODE
    config.DEV_MODE = true;
    log.debug('debug2');
    expect(spy).toHaveBeenCalled();
    config.DEV_MODE = false;
    // Ativa ORACULO_DEBUG
    process.env.ORACULO_DEBUG = 'true';
    log.debug('debug3');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('não imprime info/sucesso/aviso se REPORT_SILENCE_LOGS=true', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    config.REPORT_SILENCE_LOGS = true;
    log.info('x');
    log.sucesso('y');
    log.aviso('z');
    expect(spy).not.toHaveBeenCalled();
    config.REPORT_SILENCE_LOGS = false;
  });
});
