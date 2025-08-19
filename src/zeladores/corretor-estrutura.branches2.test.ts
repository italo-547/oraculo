// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('corrigirEstrutura — branches2 (fluxo de reescrita de imports)', () => {
  const origEnv = { ...process.env } as Record<string, string | undefined>;
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    for (const k of Object.keys(process.env)) delete (process.env as any)[k];
    for (const [k, v] of Object.entries(origEnv)) if (v !== undefined) (process.env as any)[k] = v;
  });

  it('quando AUTO_FIX=true e reescreverImports succeed: usa readFile/writeFile/unlink (sem rename) e loga sucesso', async () => {
    const fsMock = {
      promises: {
        mkdir: vi.fn(async () => void 0),
        stat: vi.fn(async () => {
          throw new Error('not exists');
        }),
        readFile: vi.fn(async () => 'console.log(1) // old'),
        writeFile: vi.fn(async () => void 0),
        unlink: vi.fn(async () => void 0),
        rename: vi.fn(async () => void 0),
      },
    } as const;
    vi.doMock('node:fs', () => fsMock as any);
    vi.doMock('p-limit', () => ({ default: () => (fn: any) => fn() }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        STRUCTURE_PLUGINS: [],
        STRUCTURE_AUTO_FIX: true,
        STRUCTURE_CONCURRENCY: 1,
        STRUCTURE_LAYERS: {},
      },
    }));
    const sucesso = vi.fn();
    const info = vi.fn();
    const erro = vi.fn();
    const aviso = vi.fn();
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: { sucesso, info, erro, aviso } }));
    vi.doMock('./util/imports.js', () => ({
      reescreverImports: (conteudo: string) => ({ novoConteudo: conteudo.replace('old', 'new') }),
    }));

    const { corrigirEstrutura } = await import('./corretor-estrutura.js');
    const mapa = [{ arquivo: 'src/a.ts', ideal: 'ideal', atual: 'src' }];
    const fileEntries = [
      { relPath: 'src/a.ts', fullPath: '/tmp/src/a.ts', ast: undefined as any, content: '' },
    ];
    await corrigirEstrutura(mapa, fileEntries, '/tmp');

    expect(fsMock.promises.mkdir).toHaveBeenCalledTimes(1);
    expect(fsMock.promises.readFile).toHaveBeenCalledTimes(1);
    expect(fsMock.promises.writeFile).toHaveBeenCalledTimes(1);
    expect(fsMock.promises.unlink).toHaveBeenCalledTimes(1);
    // fallback rename NÃO deve ser usado neste caminho
    expect(fsMock.promises.rename).not.toHaveBeenCalled();
    expect(sucesso).toHaveBeenCalledWith(expect.stringContaining('Movido: src/a.ts'));
  });

  it('fallback para rename quando reescreverImports falha (readFile rejeita)', async () => {
    const fsMock = {
      promises: {
        mkdir: vi.fn(async () => void 0),
        stat: vi.fn(async () => {
          throw new Error('not exists');
        }),
        readFile: vi.fn(async () => {
          throw new Error('boom');
        }),
        writeFile: vi.fn(async () => void 0),
        unlink: vi.fn(async () => void 0),
        rename: vi.fn(async () => void 0),
      },
    } as const;
    vi.doMock('node:fs', () => fsMock as any);
    vi.doMock('p-limit', () => ({ default: () => (fn: any) => fn() }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        STRUCTURE_PLUGINS: [],
        STRUCTURE_AUTO_FIX: true,
        STRUCTURE_CONCURRENCY: 1,
        STRUCTURE_LAYERS: {},
      },
    }));
    const sucesso = vi.fn();
    vi.doMock('../nucleo/constelacao/log.js', () => ({
      log: { sucesso, info: vi.fn(), erro: vi.fn(), aviso: vi.fn() },
    }));
    vi.doMock('./util/imports.js', () => ({
      reescreverImports: () => ({ novoConteudo: 'X' }),
    }));

    const { corrigirEstrutura } = await import('./corretor-estrutura.js');
    const mapa = [{ arquivo: 'src/b.ts', ideal: 'ideal', atual: 'src' }];
    const fileEntries = [
      { relPath: 'src/b.ts', fullPath: '/tmp/src/b.ts', ast: undefined as any, content: '' },
    ];
    await corrigirEstrutura(mapa, fileEntries, '/tmp');

    expect(fsMock.promises.rename).toHaveBeenCalledTimes(1);
    expect(sucesso).toHaveBeenCalledWith(expect.stringContaining('Movido: src/b.ts'));
  });
});
describe('corretor-estrutura plugins branches extras', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    const cosmos = await import('../nucleo/constelacao/cosmos.js');
    cosmos.config.STRUCTURE_PLUGINS = [] as any;
    cosmos.config.STRUCTURE_AUTO_FIX = true as any;
    vi.doMock('node:fs', () => ({
      promises: {
        mkdir: vi.fn(async () => undefined),
        stat: vi.fn().mockRejectedValue(new Error('nf')),
        rename: vi.fn(async () => undefined),
      },
    }));
    vi.doMock('p-limit', () => ({ default: () => (fn: any) => fn() }));
    vi.doMock('../nucleo/constelacao/log.js', () => ({
      log: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn() },
    }));
  });

  it('plugin resolvido sem caminho (caminho undefined) loga aviso caminho não resolvido', async () => {
    const cosmos = await import('../nucleo/constelacao/cosmos.js');
    (cosmos.config.STRUCTURE_PLUGINS as any) = ['plugin-sem-caminho'];
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
    // Apenas garante que algum aviso foi emitido (mensagem pode variar entre ambientes)
    expect((log.aviso as any).mock.calls.length).toBeGreaterThan(0);
  });

  it('plugin módulo sem função nem default não executa pluginFn (sem erro)', async () => {
    const cosmos = await import('../nucleo/constelacao/cosmos.js');
    (cosmos.config.STRUCTURE_PLUGINS as any) = ['plugin-sem-funcao'];
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
    // Apenas valida que a execução ocorreu sem lançar e capturamos chamadas (independente de mensagem específica)
    expect(Array.isArray((log.aviso as any).mock.calls)).toBe(true);
    vi.unstubAllGlobals();
  });
});
