import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { importarModuloSeguro } from '../../../src/nucleo/util/import-safe.js';
import { config } from '../../../src/nucleo/constelacao/cosmos.js';
import fs from 'node:fs';
import path from 'node:path';

describe('importarModuloSeguro', () => {
  const tmpDir = path.join(process.cwd(), 'tests', 'tmp-modules');
  beforeEach(() => {
    config.SAFE_MODE = true;
    config.ALLOW_PLUGINS = false;
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  });
  afterEach(() => {
    config.ALLOW_PLUGINS = false;
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it('deve bloquear import quando SAFE_MODE ativo e ALLOW_PLUGINS=false', async () => {
    await expect(importarModuloSeguro(process.cwd(), './tests/tmp-modules/x.js')).rejects.toThrow(
      /Carregamento de plugins desabilitado/,
    );
  });

  it('deve importar modulo quando permitido e caminho dentro da raiz', async () => {
    config.ALLOW_PLUGINS = true;
    const file = path.join(tmpDir, 'mod-a.js');
    fs.writeFileSync(file, "export default function(){ return 'ok' }", 'utf-8');
    const mod = await importarModuloSeguro(process.cwd(), './tests/tmp-modules/mod-a.js');
    expect(mod).toBeTruthy();
    if (mod && typeof mod === 'object' && 'default' in mod) {
      // chamada apenas para garantir execução
      const fn = (mod as any).default as Function;
      expect(fn()).toBe('ok');
    }
  });
});
