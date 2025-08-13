import { describe, it, expect } from 'vitest';
import { sanitizarRelPath, resolverPluginSeguro } from './seguranca.js';

describe('seguranca extra branches', () => {
  it('sanitiza caminhos iniciando com ../ múltiplos', () => {
    const r = sanitizarRelPath('../../../../secret.txt');
    expect(r.startsWith('..')).toBe(false);
    expect(r).not.toContain('secret/../');
  });
  it('resolverPluginSeguro falha para string vazia', () => {
    const r = resolverPluginSeguro(process.cwd(), '');
    expect(r.erro).toMatch(/inválida/i);
  });
});
