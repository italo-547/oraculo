// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { config } from '../nucleo/constelacao/cosmos.js';

vi.mock('node:fs', () => ({
  promises: {
    mkdir: vi.fn(async () => undefined),
    stat: vi.fn().mockRejectedValue(new Error('nf')),
    rename: vi.fn(async () => undefined),
  },
}));
vi.mock('p-limit', () => ({ default: () => (fn: any) => fn() }));
vi.mock('../nucleo/constelacao/log.js', () => ({
  log: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn() },
}));

describe('corretor-estrutura plugins branches extras', () => {
  beforeEach(() => {
    // Não usamos resetModules aqui para não perder mocks declarados no topo (log, fs, etc.)
    vi.clearAllMocks();
    config.STRUCTURE_PLUGINS = [] as any;
    config.STRUCTURE_AUTO_FIX = true as any;
  });

  it('plugin resolvido sem caminho (caminho undefined) loga aviso caminho não resolvido', async () => {
    (config.STRUCTURE_PLUGINS as any) = ['plugin-sem-caminho'];
    vi.doMock('../nucleo/constelacao/seguranca.js', () => ({
      resolverPluginSeguro: () => ({ caminho: undefined }),
    }));
    const { corrigirEstrutura } = await import('./corretor-estrutura.js');
    const mapa = [{ arquivo: 'src/a.ts', ideal: 'dest', atual: 'src' }];
    const fileEntries: any[] = [
      { relPath: 'src/a.ts', fullPath: '/tmp/src/a.ts', ast: undefined, content: '' },
    ];
    await corrigirEstrutura(mapa as any, fileEntries as any, '/tmp');
    const { log } = await import('../nucleo/constelacao/log.js');
    const avisos = (log.aviso as any).mock.calls.map((c: any) => c[0]).join('\n');
    expect(avisos).toMatch(/Caminho de plugin não resolvido/);
  });

  it('plugin módulo sem função nem default não executa pluginFn (sem erro)', async () => {
    (config.STRUCTURE_PLUGINS as any) = ['plugin-sem-funcao'];
    vi.doMock('../nucleo/constelacao/seguranca.js', () => ({
      resolverPluginSeguro: () => ({ caminho: '/virtual/plugin-sem-funcao.js' }),
    }));
    vi.stubGlobal('import', async (mod: string) => {
      if (mod === '/virtual/plugin-sem-funcao.js') return { alguma: 1 } as any;
      return {} as any;
    });
    const { corrigirEstrutura } = await import('./corretor-estrutura.js');
    const mapa = [{ arquivo: 'src/b.ts', ideal: 'dest', atual: 'src' }];
    const fileEntries: any[] = [
      { relPath: 'src/b.ts', fullPath: '/tmp/src/b.ts', ast: undefined, content: '' },
    ];
    await corrigirEstrutura(mapa as any, fileEntries as any, '/tmp');
    const { log } = await import('../nucleo/constelacao/log.js');
    const avisos = (log.aviso as any).mock.calls.map((c: any) => c[0]);
    expect(avisos.some((m: string) => /Plugin falhou/.test(m))).toBe(false);
    vi.unstubAllGlobals();
  });
});
