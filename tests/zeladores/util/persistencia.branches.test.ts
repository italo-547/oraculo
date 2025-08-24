// SPDX-License-Identifier: MIT
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'node:path';
import { promises as fs } from 'node:fs';

const ORIG_ENV: Record<string, string | undefined> = { ...process.env } as any;

describe('persistencia – branches', () => {
  const TMP_DIR = path.join(process.cwd(), 'tmp-persistencia-test');
  const file = (name: string) => path.join(TMP_DIR, name);

  beforeEach(async () => {
    vi.resetModules();
    await fs.mkdir(TMP_DIR, { recursive: true });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    // restaura env
    for (const k of Object.keys(process.env)) delete (process.env as any)[k];
    for (const [k, v] of Object.entries(ORIG_ENV)) if (v !== undefined) (process.env as any)[k] = v;
    // limpeza best-effort
    try {
      const entries = await fs.readdir(TMP_DIR).catch(() => []);
      for (const e of entries) await fs.rm(path.join(TMP_DIR, e), { force: true });
      await fs.rmdir(TMP_DIR).catch(() => {});
    } catch {}
  });

  it('lerEstado retorna [] quando arquivo não existe e sem padrão', async () => {
    const { lerEstado } = await import('../../src/zeladores/util/persistencia.js');
    const out = await lerEstado(file('nao-existe.json'));
    expect(Array.isArray(out)).toBe(true);
    expect((out as unknown[]).length).toBe(0);
  });

  it('lerEstado retorna padrão quando JSON inválido', async () => {
    const alvo = file('invalido.json');
    await fs.writeFile(alvo, '{ invalido', 'utf-8');
    const { lerEstado } = await import('../../src/zeladores/util/persistencia.js');
    const padrao = { ok: true } as const;
    const out = await lerEstado<typeof padrao>(alvo, padrao);
    expect(out).toEqual(padrao);
  });

  it('salvarEstado grava string raw e lerArquivoTexto lê de volta', async () => {
    const alvo = file('raw.txt');
    const { salvarEstado, lerArquivoTexto } = await import(
      '../../src/zeladores/util/persistencia.js'
    );
    await salvarEstado(alvo, 'plain');
    const text = await lerArquivoTexto(alvo);
    expect(text).toBe('plain');
  });

  it('salvarEstadoAtomico grava JSON e bloqueia caminho fora da raiz quando VITEST=""', async () => {
    const { salvarEstadoAtomico } = await import('../../src/zeladores/util/persistencia.js');
    const alvo = file('obj.json');
    await salvarEstadoAtomico(alvo, { a: 1, b: 2 });
    const raw = await fs.readFile(alvo, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed).toEqual({ a: 1, b: 2 });

    // força validação de raiz: VITEST string vazia ativa bloqueio
    (process.env as any).VITEST = '';
    const outside = path.resolve(process.cwd(), '..', 'fora-da-raiz', 'x.json');
    // garante que diretório pai não será criado (erro deve ocorrer antes)
    await expect(salvarEstadoAtomico(outside, { x: 1 })).rejects.toThrow(
      /caminho fora da raiz do projeto/i,
    );
  });
});
