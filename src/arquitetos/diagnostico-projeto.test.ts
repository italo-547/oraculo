import { describe, it, expect } from 'vitest';
import { diagnosticarProjeto } from './diagnostico-projeto.js';
import type { SinaisProjeto, DiagnosticoProjeto } from '../tipos/tipos.js';

describe('diagnosticarProjeto', () => {
    it('detecta projeto desconhecido', () => {
        const sinais: SinaisProjeto = {};
        const resultado = diagnosticarProjeto(sinais);
        expect(resultado.tipo).toBe('desconhecido');
        expect(resultado.confiabilidade).toBeLessThan(1);
    });

    it('detecta projeto do tipo landing', () => {
        const sinais: SinaisProjeto = { temPages: true };
        const resultado = diagnosticarProjeto(sinais);
        expect(resultado.tipo).toBe('landing');
    });

    it('detecta projeto do tipo api', () => {
        const sinais: SinaisProjeto = { temApi: true, temExpress: true };
        const resultado = diagnosticarProjeto(sinais);
        expect(resultado.tipo).toBe('api');
    });

    it('detecta projeto do tipo cli', () => {
        const sinais: SinaisProjeto = { temCli: true };
        const resultado = diagnosticarProjeto(sinais);
        expect(resultado.tipo).toBe('cli');
    });
});
