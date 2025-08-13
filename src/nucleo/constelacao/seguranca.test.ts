import { describe, it, expect } from 'vitest';
import { sanitizarRelPath, estaDentro, resolverPluginSeguro, filtrarGlobSeguros } from './seguranca.js';
import path from 'node:path';

describe('seguranca utilitarios', () => {
    it('sanitiza caminhos removendo drive e normalizando', () => {
        expect(sanitizarRelPath('C:..\\..\\src\\index.ts')).toBe('src/index.ts');
        expect(sanitizarRelPath('../../etc/passwd')).toBe('etc/passwd');
        expect(sanitizarRelPath('..\\..\\algum/../outro')).toBe('outro');
    });

    it('detecta se caminho esta dentro da base', () => {
        const base = process.cwd();
        const interno = path.join(base, 'src', 'arquivo.ts');
        const externo = path.resolve(base, '..', 'fora.js');
        expect(estaDentro(base, interno)).toBe(true);
        expect(estaDentro(base, externo)).toBe(false);
    });

    it('resolve plugin seguro rejeitando fora da raiz ou extensão invalida', () => {
        const base = process.cwd();
        const ok = resolverPluginSeguro(base, 'src/modulo.ts');
        expect(typeof ok.caminho === 'string' && /src[\\/]+modulo\.ts$/.test(ok.caminho)).toBe(true);
        const fora = resolverPluginSeguro(base, '../hack.js');
        expect(fora.erro).toMatch(/fora da raiz/);
        const inval = resolverPluginSeguro(base, 'script.sh');
        expect(inval.erro).toMatch(/extensão/);
    });

    it('filtra globs inseguros', () => {
        const entrada = ['src/**', 'a/**/**/**/**/**/b', 'normal/*.ts'];
        const filtrado = filtrarGlobSeguros(entrada);
        expect(filtrado).toEqual(['src/**', 'normal/*.ts']);
    });
});
