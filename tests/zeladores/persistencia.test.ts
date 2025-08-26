/// <reference types="vitest" />
import { vi } from 'vitest';
import path from 'node:path';

describe('persistencia util', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('lerEstado retorna JSON quando arquivo válido', async () => {
    const fs = await import('node:fs');
    const tmpDir = path.join(process.cwd(), '.oraculo-test');
    await fs.promises.mkdir(tmpDir, { recursive: true });
    const file = path.join(tmpDir, 'x.json');
    await fs.promises.writeFile(file, JSON.stringify({ a: 1 }), 'utf-8');
    const mod = await import('../../src/zeladores/util/persistencia.js');
    const res = await (mod as any).lerEstado(file);
    expect(res).toEqual({ a: 1 });
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('lerEstado retorna padrao quando json inválido', async () => {
    const fs = await import('node:fs');
    const tmpDir = path.join(process.cwd(), '.oraculo-test');
    await fs.promises.mkdir(tmpDir, { recursive: true });
    const file = path.join(tmpDir, 'bad.json');
    await fs.promises.writeFile(file, 'not-json', 'utf-8');
    const mod = await import('../../src/zeladores/util/persistencia.js');
    const res = await (mod as any).lerEstado(file, { ok: true });
    expect(res).toEqual({ ok: true });
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('salvarEstado escreve em tmp e renomeia', async () => {
    const fs = await import('node:fs');
    const tmpDir = path.join(process.cwd(), '.oraculo-test');
    await fs.promises.mkdir(tmpDir, { recursive: true });
    const out = path.join(tmpDir, 'tmp-salvar.json');
    const mod = await import('../../src/zeladores/util/persistencia.js');
    await (mod as any).salvarEstado(out, { x: 2 });
    const content = await fs.promises.readFile(out, 'utf-8');
    expect(content).toContain('"x": 2');
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });
});
