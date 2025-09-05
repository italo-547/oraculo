import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());

describe('oraculo.config.safe.json', () => {
  it('deve habilitar SAFE_MODE e desabilitar exec/plugins por segurança', async () => {
    const p = path.join(ROOT, 'oraculo.config.safe.json');
    const raw = await fs.readFile(p, 'utf8');
    const json = JSON.parse(raw);
    expect(json.SAFE_MODE).toBe(true);
    expect(json.ALLOW_PLUGINS).toBe(false);
    expect(json.ALLOW_EXEC).toBe(false);
    expect(json.ALLOW_MUTATE_FS).toBe(false);
  });
});

describe('inc-state.json', () => {
  it('deve ser JSON válido e conter estrutura esperada de arquivos', async () => {
    const p = path.join(ROOT, 'inc-state.json');
    const raw = await fs.readFile(p, 'utf8');
    const json = JSON.parse(raw);
    expect(json).toBeTypeOf('object');
    expect(json.arquivos).toBeTypeOf('object');
    // um exemplo mínimo de verificação
    const keys = Object.keys(json.arquivos || {});
    expect(keys.length).toBeGreaterThanOrEqual(0);
  });
});
