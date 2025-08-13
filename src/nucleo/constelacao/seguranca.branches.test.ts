import { describe, it, expect } from 'vitest';
import { sanitizarRelPath, validarGlobBasico, filtrarGlobSeguros, resolverPluginSeguro } from './seguranca.js';
import path from 'node:path';

describe('seguranca helpers branches', () => {
    it('sanitiza caminhos com drive e tentativa de escape', () => {
        const r = sanitizarRelPath('C:..\\..\\etc/passwd');
        expect(r).not.toMatch(/^[.][.]/);
        expect(r).not.toContain('C:');
    });

    it('bloqueia glob muito longo e com muitas ocorrências de **', () => {
        const longo = 'a'.repeat(301);
        expect(validarGlobBasico(longo)).toBe(false);
        const many = '**/a/**/b/**/c/**/d/**/e';
        expect(validarGlobBasico(many)).toBe(false);
    });

    it('filtra padrões inseguros', () => {
        const lista = ['src/**', '**/a/**/b/**/c/**/d/**/e', 'normal'];
        const filtrado = filtrarGlobSeguros(lista);
        expect(filtrado).toContain('src/**');
        expect(filtrado).toContain('normal');
        expect(filtrado.some(p => p.includes('d/**/e'))).toBe(false);
    });

    it('resolverPluginSeguro rejeita fora da raiz e extensão inválida', () => {
        const base = process.cwd();
        const externo = path.resolve('..', 'fora.js');
        const r1 = resolverPluginSeguro(base, externo);
        expect(r1.erro).toMatch(/fora da raiz/);
        const inval = resolverPluginSeguro(base, 'plugin.txt');
        expect(inval.erro).toMatch(/extensão/);
    });
});
