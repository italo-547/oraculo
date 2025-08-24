// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { config } from '../../src/nucleo/constelacao/cosmos.js';

// Mock dependências externas
vi.mock('node:fs', () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    stat: vi.fn().mockRejectedValue(new Error('not found')),
    rename: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock('p-limit', () => ({
  default: () => (fn: any) => fn(),
}));
vi.mock('../../src/nucleo/constelacao/cosmos.js', () => ({
  config: {
    STRUCTURE_PLUGINS: [] as any, // Corrige tipo para evitar erro de never
    STRUCTURE_AUTO_FIX: true,
    STRUCTURE_CONCURRENCY: 1,
    STRUCTURE_LAYERS: {},
  } as any,
}));
vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: {
    info: vi.fn(),
    erro: vi.fn(),
    sucesso: vi.fn(),
    aviso: vi.fn(),
  },
}));

describe('corrigirEstrutura', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    config.STRUCTURE_AUTO_FIX = true;
    config.STRUCTURE_PLUGINS = [];
  });

  it('move arquivos quando ideal é diferente do atual', async () => {
    const { corrigirEstrutura } = await import('../../src/zeladores/corretor-estrutura.js');
    const mapa = [{ arquivo: 'src/a.ts', ideal: 'dest', atual: 'src' }];
    const fileEntries = [
      { relPath: 'src/a.ts', fullPath: '/tmp/src/a.ts', ast: undefined as any, content: '' },
    ];
    await corrigirEstrutura(mapa, fileEntries, '/tmp');
    // Espera chamada de mkdir e rename
    const { promises } = await import('node:fs');
    expect(promises.mkdir).toHaveBeenCalled();
    expect(promises.rename).toHaveBeenCalled();
  });

  it('não move se ideal for igual ao atual', async () => {
    const { corrigirEstrutura } = await import('../../src/zeladores/corretor-estrutura.js');
    const mapa = [{ arquivo: 'src/b.ts', ideal: 'src', atual: 'src' }];
    const fileEntries = [
      { relPath: 'src/b.ts', fullPath: '/tmp/src/b.ts', ast: undefined as any, content: '' },
    ];
    await corrigirEstrutura(mapa, fileEntries, '/tmp');
    const { promises } = await import('node:fs');
    expect(promises.rename).not.toHaveBeenCalled();
  });

  it('simula correção de estrutura (AUTO_FIX=false)', async () => {
    config.STRUCTURE_AUTO_FIX = false;
    const { corrigirEstrutura } = await import('../../src/zeladores/corretor-estrutura.js');
    const mapa = [{ arquivo: 'src/c.ts', ideal: 'ideal', atual: 'src' }];
    const fileEntries: import('../../src/tipos/tipos.js').FileEntryWithAst[] = [
      { relPath: 'src/c.ts', fullPath: '/tmp/src/c.ts', ast: undefined as any, content: '' },
    ];
    await corrigirEstrutura(mapa, fileEntries, '/tmp');
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    // Verifica se alguma chamada de log.info contém 'Simular'
    const chamadas = (log.info as any).mock.calls.flat();
    console.log('LOG.INFO chamadas:', chamadas);
    expect(chamadas.some((msg: string) => msg.includes('Simular'))).toBe(true);
  });

  it('executa plugin válido e plugin com erro', async () => {
    (config.STRUCTURE_PLUGINS as string[]).splice(
      0,
      config.STRUCTURE_PLUGINS.length,
      './plugin-valido.js',
      './plugin-erro.js',
    );
    // Mock do import dinâmico
    const pluginValido = vi.fn();
    const pluginErro = vi.fn(() => {
      throw new Error('erro plugin');
    });
    vi.stubGlobal('import', async (mod: string) => {
      if (mod.endsWith('plugin-valido.js')) return { default: pluginValido };
      if (mod.endsWith('plugin-erro.js')) return { default: pluginErro };
      throw new Error('not found');
    });
    const { corrigirEstrutura } = await import('../../src/zeladores/corretor-estrutura.js');
    const mapa = [{ arquivo: 'src/d.ts', ideal: 'ideal', atual: 'src' }];
    const fileEntries: import('../../src/tipos/tipos.js').FileEntryWithAst[] = [
      { relPath: 'src/d.ts', fullPath: '/tmp/src/d.ts', ast: undefined as any, content: '' },
    ];
    const baseDir = (await import('node:path')).resolve(__dirname, '../..');
    await corrigirEstrutura(mapa, fileEntries, baseDir);
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    // Verifica se alguma chamada de log.aviso contém 'Plugin falhou'
    const chamadasAviso = (log.aviso as any).mock.calls.flat();
    console.log('LOG.AVISO chamadas:', chamadasAviso);
    expect(chamadasAviso.some((msg: string) => msg.includes('Plugin falhou'))).toBe(true);
    config.STRUCTURE_PLUGINS = [];
    vi.unstubAllGlobals();
  });
});

describe('corrigirEstrutura - branches de erro e caminhos alternativos', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    config.STRUCTURE_AUTO_FIX = true;
    config.STRUCTURE_PLUGINS = [];
  });

  it('loga erro se mkdir falhar', async () => {
    const { corrigirEstrutura } = await import('../../src/zeladores/corretor-estrutura.js');
    const { promises } = await import('node:fs');
    (promises.mkdir as any).mockRejectedValueOnce(new Error('mkdir fail'));
    const mapa = [{ arquivo: 'src/e.ts', ideal: 'dest', atual: 'src' }];
    const fileEntries = [
      { relPath: 'src/e.ts', fullPath: '/tmp/src/e.ts', ast: undefined as any, content: '' },
    ];
    await corrigirEstrutura(mapa, fileEntries, '/tmp');
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    expect(log.erro).toHaveBeenCalledWith(expect.stringContaining('Falha ao criar diretório'));
  });

  it('loga erro se stat lançar erro inesperado (rename falha)', async () => {
    const { corrigirEstrutura } = await import('../../src/zeladores/corretor-estrutura.js');
    const { promises } = await import('node:fs');
    (promises.stat as any).mockRejectedValueOnce('erro estranho');
    (promises.mkdir as any).mockResolvedValueOnce(undefined);
    (promises.rename as any).mockRejectedValueOnce(new Error('rename fail stat'));
    const mapa = [{ arquivo: 'src/f.ts', ideal: 'dest', atual: 'src' }];
    const fileEntries = [
      { relPath: 'src/f.ts', fullPath: '/tmp/src/f.ts', ast: undefined as any, content: '' },
    ];
    await corrigirEstrutura(mapa, fileEntries, '/tmp');
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    expect(log.erro).toHaveBeenCalledWith(expect.stringContaining('Falha ao mover'));
  });

  it('loga erro se destino já existir', async () => {
    const { corrigirEstrutura } = await import('../../src/zeladores/corretor-estrutura.js');
    const { promises } = await import('node:fs');
    (promises.stat as any).mockResolvedValueOnce(true); // destinoExiste = true
    (promises.mkdir as any).mockResolvedValueOnce(undefined);
    const mapa = [{ arquivo: 'src/g.ts', ideal: 'dest', atual: 'src' }];
    const fileEntries = [
      { relPath: 'src/g.ts', fullPath: '/tmp/src/g.ts', ast: undefined as any, content: '' },
    ];
    await corrigirEstrutura(mapa, fileEntries, '/tmp');
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    expect(log.erro).toHaveBeenCalledWith(expect.stringContaining('Destino já existe'));
  });

  it('loga erro se rename falhar', async () => {
    const { corrigirEstrutura } = await import('../../src/zeladores/corretor-estrutura.js');
    const { promises } = await import('node:fs');
    (promises.stat as any).mockRejectedValueOnce(new Error('not found'));
    (promises.mkdir as any).mockResolvedValueOnce(undefined);
    (promises.rename as any).mockRejectedValueOnce(new Error('rename fail'));
    const mapa = [{ arquivo: 'src/h.ts', ideal: 'dest', atual: 'src' }];
    const fileEntries = [
      { relPath: 'src/h.ts', fullPath: '/tmp/src/h.ts', ast: undefined as any, content: '' },
    ];
    await corrigirEstrutura(mapa, fileEntries, '/tmp');
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    expect(log.erro).toHaveBeenCalledWith(expect.stringContaining('Falha ao mover'));
  });

  it('executa plugin como função direta (não default)', async () => {
    const path = await import('node:path');
    const pluginPath = path.resolve(
      __dirname,
      '../../tests/fixtures/plugins/plugin-teste-direto.js',
    );
    (config.STRUCTURE_PLUGINS as any) = [pluginPath];
    // Limpa variável global
    // @ts-ignore
    delete global.__pluginDiretoChamado;
    const { corrigirEstrutura } = await import('../../src/zeladores/corretor-estrutura.js');
    const mapa = [{ arquivo: 'src/i.ts', ideal: 'ideal', atual: 'src' }];
    const fileEntries = [
      { relPath: 'src/i.ts', fullPath: '/tmp/src/i.ts', ast: undefined as any, content: '' },
    ];
    const baseDir = path.resolve(__dirname, '../..');
    await corrigirEstrutura(mapa, fileEntries, baseDir);
    // @ts-ignore
    expect(global.__pluginDiretoChamado).toBe(true);
    config.STRUCTURE_PLUGINS = [];
  });

  it('executa plugin como objeto com default', async () => {
    const path = await import('node:path');
    const pluginPath = path.resolve(
      __dirname,
      '../../tests/fixtures/plugins/plugin-teste-default.js',
    );
    (config.STRUCTURE_PLUGINS as any) = [pluginPath];
    // Limpa variável global
    // @ts-ignore
    delete global.__pluginDefaultChamado;
    const { corrigirEstrutura } = await import('../../src/zeladores/corretor-estrutura.js');
    const mapa = [{ arquivo: 'src/z.ts', ideal: 'ideal', atual: 'src' }];
    const fileEntries = [
      { relPath: 'src/z.ts', fullPath: '/tmp/src/z.ts', ast: undefined as any, content: '' },
    ];
    const baseDir = path.resolve(__dirname, '../..');
    await corrigirEstrutura(mapa, fileEntries, baseDir);
    // @ts-ignore
    expect(global.__pluginDefaultChamado).toBe(true);
    config.STRUCTURE_PLUGINS = [];
  });

  it('loga erro desconhecido do plugin', async () => {
    (config.STRUCTURE_PLUGINS as any) = ['./plugin-estranho.js'];
    vi.stubGlobal('import', async (mod: string) => {
      if (mod.endsWith('plugin-estranho.js')) throw { foo: 12345 };
      throw new Error('not found');
    });
    const { corrigirEstrutura } = await import('../../src/zeladores/corretor-estrutura.js');
    const mapa = [{ arquivo: 'src/j.ts', ideal: 'ideal', atual: 'src' }];
    const fileEntries = [
      { relPath: 'src/j.ts', fullPath: '/tmp/src/j.ts', ast: undefined as any, content: '' },
    ];
    await corrigirEstrutura(mapa, fileEntries, '/tmp');
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    expect(log.aviso).toHaveBeenCalledWith(
      expect.stringContaining('⚠️ Plugin falhou: ./plugin-estranho.js'),
    );
    config.STRUCTURE_PLUGINS = [];
    vi.unstubAllGlobals();
  });
});
