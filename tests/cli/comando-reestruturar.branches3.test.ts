// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

// Estado compartilhado para mocks hoisted
const shared = vi.hoisted(() => {
  const defaultPlan = {
    mover: Array.from({ length: 12 }, (_, i) => ({ de: `src/a${i}.ts`, para: `src/b${i}.ts` })),
    conflitos: Array.from({ length: 12 }, (_, i) => ({ alvo: `dst/${i}`, motivo: 'existe' })),
  };
  return {
    planMode: 'none' as 'none' | 'full',
    plan: defaultPlan,
    aplicarMock: vi.fn(async () => undefined),
    planejarCalls: [] as any[],
  };
});

// Mock único para operario-estrutura controlado por `shared`
vi.mock('../../src/zeladores/operario-estrutura.js', () => ({
  OperarioEstrutura: {
    planejar: vi.fn(async () =>
      shared.planMode === 'full'
        ? { plano: shared.plan, origem: 'estrategista' as const }
        : { plano: undefined, origem: 'nenhum' as const },
    ),
    aplicar: shared.aplicarMock,
    toMapaMoves: vi.fn(() =>
      shared.plan.mover.map((m) => ({ arquivo: m.de, ideal: 'dst', atual: m.de })),
    ),
    ocorrenciasParaMapa: vi.fn(() => []),
  },
}));

describe('comandoReestruturar branches adicionais', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    shared.planMode = 'none';
    shared.planejarCalls.length = 0;
  });

  it('monta categorias, prioriza --domains sobre --flat, sem plano + --somente-plano e prepararComAst ausente', async () => {
    vi.mock('chalk', () => ({ default: { bold: (x: string) => x, yellow: (x: string) => x } }));
    vi.mock('../../src/nucleo/constelacao/cosmos.js', () => ({ config: { DEV_MODE: true } }));
    vi.mock('../../src/nucleo/constelacao/log.js', () => ({
      log: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn() },
    }));
    // prepararComAst ausente para cair no fallback
    vi.mock('../../src/nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
      executarInquisicao: vi.fn(async () => ({ ocorrencias: [] })),
      prepararComAst: undefined as unknown as undefined,
      tecnicas: [],
    }));
    const local = vi.hoisted(() => ({
      planejarMock: vi.fn(async (_baseDir: string, _fe: any[], op: any) => ({
        plano: undefined,
        origem: 'nenhum' as const,
      })),
    }));
    // operario-estrutura já mockado no topo via `shared`

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as any);
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    const { comandoReestruturar } = await import('../../src/cli/comando-reestruturar.js');
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    program.addCommand(comandoReestruturar(aplicarFlagsGlobais));

    await program.parseAsync([
      'node',
      'cli',
      'reestruturar',
      '--somente-plano',
      '--domains',
      '--flat',
      '--categoria',
      'controller=handlers',
      '--categoria',
      'invalido',
      '--categoria',
      'service=services',
    ]);

    // Aviso de conflito domains+flat
    expect(log.aviso).toHaveBeenCalledWith(expect.stringContaining('domains e --flat informados'));
    // Dry-run informado
    expect(log.info).toHaveBeenCalledWith(
      expect.stringContaining('Dry-run solicitado (--somente-plano)'),
    );
    // planejar foi utilizado (via mock do topo); não deve encerrar o processo
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('gera blocos via log.bloco com plano e conflitos > 10 (try-path) e aplica movimentos com --aplicar', async () => {
    vi.mock('chalk', () => ({ default: { bold: (x: string) => x, yellow: (x: string) => x } }));
    vi.mock('../../src/nucleo/constelacao/cosmos.js', () => ({ config: { DEV_MODE: true } }));
    vi.mock('../../src/nucleo/constelacao/log.js', () => {
      const blocoFn = vi.fn((titulo: string, linhas: string[]) => [titulo, ...linhas].join('\n'));
      return {
        log: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn(), bloco: blocoFn },
      };
    });
    vi.mock('../../src/nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({
        fileEntries: [{ relPath: 'src/a.ts', fullPath: 'x' }],
      })),
      executarInquisicao: vi.fn(async () => ({ ocorrencias: [] })),
      prepararComAst: vi.fn(async (e: any) => e),
      tecnicas: [],
    }));
    // operario-estrutura já mockado no topo via `shared`

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as any);
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    const { comandoReestruturar } = await import('../../src/cli/comando-reestruturar.js');
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    program.addCommand(comandoReestruturar(aplicarFlagsGlobais));

    // configura para retornar plano completo
    shared.planMode = 'full';
    await program.parseAsync(['node', 'cli', 'reestruturar', '--aplicar']);

    // Imprimiu blocos para plano e conflitos (com linhas "+2 restantes")
    const printed = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(printed).toMatch(/Plano de reestruturação/);
    expect(printed).toMatch(/Conflitos de destino/);
    expect(printed).toMatch(/\+2 restantes/);
    // Também registrou info do plano sugerido
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('Plano sugerido (estrategista)'));
    // Aplicação efetuada
    expect(shared.aplicarMock).toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
