// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn() },
}));
vi.mock('chalk', () => ({ default: { bold: (x: string) => x, yellow: (x: string) => x } }));
vi.mock('../../src/nucleo/constelacao/cosmos.js', () => ({ config: {} }));
vi.mock('../../src/nucleo/inquisidor.js', () => ({
  iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
  executarInquisicao: vi.fn(async () => ({ ocorrencias: [] })),
  prepararComAst: vi.fn(async (e: any) => e),
  tecnicas: [],
}));
// detector retorna plano grande com conflitos
vi.mock('../../src/analistas/detector-arquetipos.ts', () => ({
  detectarArquetipos: vi.fn(async () => ({
    melhores: [
      {
        planoSugestao: {
          mover: Array.from({ length: 12 }, (_, i) => ({
            de: `src/a${i}.ts`,
            para: `src/b${i}.ts`,
          })),
          conflitos: [
            { alvo: 'x', motivo: 'existe' },
            { alvo: 'y', motivo: 'perm' },
          ],
        },
      },
    ],
  })),
}));
vi.mock('../../src/zeladores/corretor-estrutura.js', () => ({
  corrigirEstrutura: vi.fn(async () => undefined),
}));

let log: any;
beforeEach(async () => {
  vi.resetModules();
  // Aplica todos os mocks ANTES de qualquer import do comando
  vi.mock('../../src/nucleo/constelacao/log.js', () => ({
    log: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn() },
  }));
  vi.mock('chalk', () => ({ default: { bold: (x: string) => x, yellow: (x: string) => x } }));
  vi.mock('../../src/nucleo/constelacao/cosmos.js', () => ({ config: {} }));
  vi.mock('../../src/nucleo/inquisidor.js', () => ({
    iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
    executarInquisicao: vi.fn(async () => ({ ocorrencias: [] })),
    prepararComAst: vi.fn(async (e: any) => e),
    tecnicas: [],
  }));
  vi.mock('../../src/analistas/detector-arquetipos.ts', () => ({
    detectarArquetipos: vi.fn(async () => ({
      candidatos: [
        {
          planoSugestao: {
            mover: Array.from({ length: 12 }, (_, i) => ({
              de: `src/a${i}.ts`,
              para: `src/b${i}.ts`,
            })),
            conflitos: [
              { alvo: 'x', motivo: 'existe' },
              { alvo: 'y', motivo: 'perm' },
            ],
          },
        },
      ],
    })),
  }));
  vi.mock('../../src/zeladores/corretor-estrutura.js', () => ({
    corrigirEstrutura: vi.fn(async () => undefined),
  }));
  log = (await import('../../src/nucleo/constelacao/log.js')).log;
});

describe('comando reestruturar branches extras', () => {
  it('plano com >10 movimentos e conflitos gera logs esperados com --aplicar', async () => {
    const { comandoReestruturar } = await import('../../src/cli/comando-reestruturar.js');
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    program.addCommand(comandoReestruturar(aplicarFlagsGlobais));
    await program.parseAsync([
      'node',
      'cli',
      'reestruturar',
      '--aplicar',
      '--preset',
      'node-community',
    ]);
    // Aceita variações: busca a primeira string que contenha o texto esperado
    const infos = (log.info as any).mock.calls.map((c: any[]) => c.join(' ')).join('\n');
    const avisos = (log.aviso as any).mock.calls.map((c: any[]) => c.join(' ')).join('\n');
    const movOk = /12 movimentação/.test(infos);
    const restOk = /\+2 restantes/.test(infos);
    const confOk = /Conflitos detectados: 2/.test(avisos);
    if (!movOk || !restOk || !confOk) {
      console.log('INFO DEBUG:', infos);
      console.log('AVISO DEBUG:', avisos);
    }
    expect(movOk).toBe(true);
    expect(restOk).toBe(true);
    expect(confOk).toBe(true);
  });
});
