// SPDX-License-Identifier: MIT
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'node:path';

describe('persistencia fallbacks e ramos', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('usa callback API quando promises indisponível', async () => {
    const store: Record<string, string> = {};
    const mockFs = {
      promises: {},
      readFile: (p: string, e: BufferEncoding, cb: any) => cb(null, store[p] ?? ''),
      writeFile: (p: string, d: string, o: any, cb: any) => {
        store[p] = d;
        cb(null);
      },
      rename: (o: string, n: string, cb: any) => {
        store[n] = store[o];
        delete store[o];
        cb(null);
      },
      mkdir: (p: string, o: any, cb: any) => cb(null),
    };
    vi.resetModules();
    vi.doMock('node:fs', () => mockFs);
    const mod = await import('../../src/zeladores/util/persistencia.js');

    const fakePath = path.join(process.cwd(), '.oraculo-mock', 'a.json');
    // Prepare store with JSON content
    store[fakePath] = JSON.stringify({ ok: true });
    const res = await (mod as any).lerEstado(fakePath);
    expect(res).toEqual({ ok: true });

    // salvarEstado deve escrever usando callback API fallback
    await (mod as any).salvarEstado(fakePath, { wrote: 1 });
    expect(store[fakePath]).toContain('"wrote": 1');
  });

  it('lerArquivoTexto retorna string vazia quando fs indisponível', async () => {
    const mockFs = { promises: {} /* sem callbacks */ };
    vi.resetModules();
    vi.doMock('node:fs', () => mockFs);
    const mod = await import('../../src/zeladores/util/persistencia.js');
    const res = await (mod as any).lerArquivoTexto('/caminho/naoexiste.txt');
    expect(res).toBe('');
  });

  it('assertInsideRoot lança quando VITEST vazio e caminho fora da raiz', async () => {
    // Salvando valor atual e removendo VITEST para simular produção
    const originalVitest = process.env.VITEST;
    delete process.env.VITEST;
    vi.resetModules();
    const mod = await import('../../src/zeladores/util/persistencia.js');
    const outside = path.resolve(process.cwd(), '..', 'fora.json');
    await expect((mod as any).salvarEstado(outside, { x: 1 })).rejects.toThrow(
      /Persistência negada/,
    );
    // restaurar
    if (originalVitest !== undefined) process.env.VITEST = originalVitest;
    else delete process.env.VITEST;
  });

  it('salvarEstado no-op quando fs totalmente mockado e IS_TEST true', async () => {
    // VITEST já definido no ambiente normal do Vitest; apenas mock de fs sem métodos
    const mockFs = { promises: {} };
    vi.resetModules();
    vi.doMock('node:fs', () => mockFs);
    const mod = await import('../../src/zeladores/util/persistencia.js');
    const p = path.join(process.cwd(), '.oraculo-test-noop', 'x.json');
    // Deve completar sem lançar (no-op internals)
    await expect((mod as any).salvarEstado(p, { noop: true })).resolves.toBeUndefined();
  });
});
