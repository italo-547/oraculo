// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import path from 'node:path';
import {
  deveIgnorar,
  parseNomeArquivo,
  destinoPara,
  carregarConfigEstrategia,
  DEFAULT_OPCOES,
} from './estrutura.js';

describe('estrutura.util — branches extras', () => {
  it('deveIgnorar cobre variantes: inicio, fim, segmento intermediário e igualdade', () => {
    expect(deveIgnorar('node_modules/a', ['node_modules'])).toBe(true);
    expect(deveIgnorar('a/b/node_modules/x', ['node_modules'])).toBe(true);
    expect(deveIgnorar('x/dist', ['dist'])).toBe(true);
    expect(deveIgnorar('coverage/html/index.html', ['coverage/html'])).toBe(true);
    expect(deveIgnorar('src/app.ts', ['node_modules', 'dist'])).toBe(false);
    // cobre ramo: padrão vazio (ignorado) e segmento intermediário puro
    expect(deveIgnorar('src/app.ts', [''])).toBe(false);
    expect(deveIgnorar('a/b/c.ts', ['b'])).toBe(true);
  });

  it('parseNomeArquivo cobre dot, kebab, camel e fallback por token', () => {
    expect(parseNomeArquivo('user.controller.ts')).toEqual({
      entidade: 'user',
      categoria: 'controller',
    });
    expect(parseNomeArquivo('pedido-service.ts')).toEqual({
      entidade: 'pedido',
      categoria: 'service',
    });
    expect(parseNomeArquivo('ClienteRepository.ts')).toEqual({
      entidade: 'Cliente',
      categoria: 'repository',
    });
    expect(parseNomeArquivo('auth-client.ts')).toEqual({ entidade: 'auth', categoria: 'client' });
    expect(parseNomeArquivo('foo.bar.ts')).toEqual({ entidade: null, categoria: null });
    // cobre fallback por token (sem casar dot/kebab/camel)
    expect(parseNomeArquivo('foo.bar.client.ts')).toEqual({
      entidade: 'foo.bar',
      categoria: 'client',
    });
  });

  it('destinoPara organiza por entidade quando habilitado e mantém pluralização correta', () => {
    const d1 = destinoPara('users.controller.ts', 'src', true, DEFAULT_OPCOES.categoriasMapa);
    expect(d1.destinoDir).toBe(path.posix.join('src', 'domains', 'users', 'controllers'));
    const d2 = destinoPara('pedido-service.ts', 'src', false, DEFAULT_OPCOES.categoriasMapa);
    expect(d2.destinoDir).toBe(path.posix.join('src', 'services'));
    // cobre fallback sem mapa: categoria já plural (controllers) e singular (client)
    const d3 = destinoPara('users.controllers.ts', 'src', false, {} as Record<string, string>);
    expect(d3.destinoDir).toBe(path.posix.join('src', 'controllers'));
    const d4 = destinoPara('auth.client.ts', 'src', false, {} as Record<string, string>);
    expect(d4.destinoDir).toBe(path.posix.join('src', 'clients'));
  });

  it('carregarConfigEstrategia aplica merge determinístico e overrides', async () => {
    const baseDir = process.cwd();
    const cfg = await carregarConfigEstrategia(baseDir, {
      preset: 'oraculo',
      ignorarPastas: ['coverage/html'],
      categoriasMapa: { controller: 'ctrl' },
      estiloPreferido: 'camel',
      raizCodigo: 'app',
    });
    expect(cfg.raizCodigo).toBeDefined();
    expect(Array.isArray(cfg.ignorarPastas)).toBe(true);
    expect(cfg.ignorarPastas).toContain('coverage/html');
    expect(cfg.categoriasMapa.controller).toBe('ctrl');
    expect(cfg.categoriasMapa.service).toBe('services');
    expect(cfg.estiloPreferido).toBe('camel');
    expect(cfg.raizCodigo).toBe('app');
  });

  it('carregarConfigEstrategia sem overrides usa preset padrão e cobre caminho !src', async () => {
    const baseDir = process.cwd();
    const cfg = await carregarConfigEstrategia(baseDir);
    expect(cfg).toBeDefined();
    // preset padrão oraculo desabilita subpastas por entidade
    expect(cfg.criarSubpastasPorEntidade).toBe(false);
    // categorias mantém defaults
    expect(cfg.categoriasMapa.controller).toBe('controllers');
  });
});
