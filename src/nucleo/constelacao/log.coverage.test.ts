import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as mod from './log.js';

describe('log utilitário (cobertura extra)', () => {
  const orig = { ...process.env } as Record<string, string | undefined>;
  let spyLog: any;
  beforeEach(() => {
    spyLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });
  afterEach(() => {
    spyLog.mockRestore();
    // restaura variáveis de ambiente
    for (const k of Object.keys(process.env)) delete (process.env as any)[k];
    for (const [k, v] of Object.entries(orig)) if (v !== undefined) (process.env as any)[k] = v;
  });

  it('imprimirBloco usa moldura ASCII quando ORACULO_ASCII_FRAMES=1', () => {
    process.env.ORACULO_ASCII_FRAMES = '1';
    (mod.log as any).imprimirBloco('T', ['L1']);
    const joined = (spyLog.mock.calls.flat().join('\n')) as string;
    expect(joined.includes('+')).toBe(true); // moldura ASCII
  });

  it('imprimirBloco centraliza quando ORACULO_CENTER=1 e TTY disponível', () => {
    process.env.ORACULO_CENTER = '1';
  // desativa comportamento de teste (centralização só ocorre quando não estamos sob VITEST)
  delete (process.env as any).VITEST;
    const out = process.stdout as any;
    const original = { isTTY: out.isTTY, columns: out.columns };
    try {
      (out as any).isTTY = true;
      (out as any).columns = 500; // largo para permitir pad
      (mod.log as any).imprimirBloco('Titulo', ['linha']);
      const first = (spyLog.mock.calls?.[0]?.[0] || '') as string;
      expect(/^\s+/.test(first)).toBe(true); // padding à esquerda
    } finally {
      (out as any).isTTY = original.isTTY;
      (out as any).columns = original.columns;
    }
  });

  it('respeita silêncio forçado em JSON (ORACULO_FORCE_SILENT_JSON=1)', () => {
    process.env.ORACULO_FORCE_SILENT_JSON = '1';
    (mod.log as any).info('oi');
    (mod.log as any).sucesso('ok');
    (mod.log as any).aviso('warn');
    // apenas erro deve passar (usa stderr e ignora shouldSilence)
    const spyErr = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    (mod.log as any).erro('boom');
    expect(spyLog).not.toHaveBeenCalled();
    expect(spyErr).toHaveBeenCalled();
    spyErr.mockRestore();
  });

  it('debug só loga quando ORACULO_DEBUG=true', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    (mod.log as any).debug('nope');
    expect(spy).not.toHaveBeenCalled();
    process.env.ORACULO_DEBUG = 'true';
    (mod.log as any).debug('ok');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('stripLeadingSimbolos remove emojis do início mantendo mensagem', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    (mod.log as any).info('✅ tudo certo');
    const out = (spy.mock.calls.flat().join('\n')) as string;
    expect(out.toLowerCase()).toContain('tudo certo');
    spy.mockRestore();
  });
});
