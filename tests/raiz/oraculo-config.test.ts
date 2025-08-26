import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());

describe('configurações na raiz - oraculo.config.json', () => {
  it('deve ser JSON válido e conter INCLUDE_EXCLUDE_RULES.globalExcludeGlob', async () => {
    const p = path.join(ROOT, 'oraculo.config.json');
    const raw = await fs.readFile(p, 'utf8');
    const json = JSON.parse(raw);
    expect(json).toBeTypeOf('object');
    expect(json.INCLUDE_EXCLUDE_RULES).toBeTypeOf('object');
    expect(Array.isArray(json.INCLUDE_EXCLUDE_RULES.globalExcludeGlob)).toBe(true);
    // checagem leve: padrão comum deve existir
    expect(json.INCLUDE_EXCLUDE_RULES.globalExcludeGlob).toContain('**/node_modules/**');
  });
});
