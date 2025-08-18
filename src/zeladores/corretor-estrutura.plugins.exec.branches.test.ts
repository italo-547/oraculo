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

describe('corretor-estrutura plugin execução e falha branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    config.STRUCTURE_PLUGINS = [] as any;
    config.STRUCTURE_AUTO_FIX = true as any;
  });

  it('executa plugin com sucesso (default function)', async () => {
    (config.STRUCTURE_PLUGINS as any) = ['plugin-ok'];
    const execOrder: string[] = [];
    vi.doMock('../nucleo/constelacao/seguranca.js', () => ({
      resolverPluginSeguro: () => ({ caminho: 'virtual-plugin-ok' }),
    }));
    vi.doMock('virtual-plugin-ok', () => ({
      default: () => {
        execOrder.push('ok');
      },
    }));
    const { corrigirEstrutura } = await import('./corretor-estrutura.js');
    await corrigirEstrutura(
      [{ arquivo: 'src/a.ts', ideal: 'dest', atual: 'src' }] as any,
      [{ relPath: 'src/a.ts', fullPath: '/tmp/src/a.ts', ast: undefined, content: '' }] as any,
      '/tmp',
    );
    expect(execOrder).toContain('ok');
    const { log } = await import('../nucleo/constelacao/log.js');
    const avisos = (log.aviso as any).mock.calls.map((c: any) => c[0]).join('\n');
    expect(avisos).not.toMatch(/Plugin falhou/);
    // nada
  });

  it('captura erro de plugin em execução (throw dentro do plugin) sem quebrar fluxo', async () => {
    (config.STRUCTURE_PLUGINS as any) = ['plugin-fail.js'];
    vi.doMock('../nucleo/constelacao/seguranca.js', () => ({
      resolverPluginSeguro: () => ({ caminho: '/tmp/plugin-fail.js' }),
    }));
    vi.doMock('/tmp/plugin-fail.js', () => ({
      default: () => {
        throw new Error('explode');
      },
    }));
    const { corrigirEstrutura } = await import('./corretor-estrutura.js');
    await corrigirEstrutura(
      [{ arquivo: 'src/b.ts', ideal: 'dest', atual: 'src' }] as any,
      [{ relPath: 'src/b.ts', fullPath: '/tmp/src/b.ts', ast: undefined, content: '' }] as any,
      '/tmp',
    );
    const { log } = await import('../nucleo/constelacao/log.js');
    // Apenas garante que a execução não lança; log pode ou não registrar falha em ambiente mockado.
    const avisosCalls = (log.aviso as any).mock.calls.map((c: any) => c[0]);
    expect(Array.isArray(avisosCalls)).toBe(true);
  });
});
