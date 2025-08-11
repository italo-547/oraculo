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
  it('detecta projeto do tipo fullstack', () => {
    const sinais = { ehFullstack: true } as any;
    const resultado = diagnosticarProjeto(sinais);
    expect(resultado.tipo).toBe('fullstack');
    expect(resultado.confiabilidade).toBeCloseTo(0.95, 2);
  });

  it('detecta projeto do tipo monorepo', () => {
    const sinais = { ehMonorepo: true } as any;
    const resultado = diagnosticarProjeto(sinais);
    expect(resultado.tipo).toBe('monorepo');
    expect(resultado.confiabilidade).toBeCloseTo(0.99, 2);
  });

  it('detecta projeto do tipo lib', () => {
    const sinais: SinaisProjeto = { temSrc: true };
    const resultado = diagnosticarProjeto(sinais);
    expect(resultado.tipo).toBe('lib');
    expect(resultado.confiabilidade).toBeCloseTo(0.8, 2);
  });

  it('detecta projeto do tipo api por controllers', () => {
    const sinais: SinaisProjeto = { temControllers: true };
    const resultado = diagnosticarProjeto(sinais);
    expect(resultado.tipo).toBe('api');
  });

  it('detecta projeto do tipo api por express', () => {
    const sinais: SinaisProjeto = { temExpress: true };
    const resultado = diagnosticarProjeto(sinais);
    expect(resultado.tipo).toBe('api');
  });

  it('não detecta lib se temComponents ou temApi', () => {
    const sinais: SinaisProjeto = { temSrc: true, temComponents: true };
    const resultado = diagnosticarProjeto(sinais);
    expect(resultado.tipo).not.toBe('lib');
  });
});
