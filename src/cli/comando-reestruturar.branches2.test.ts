// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

vi.mock('../nucleo/constelacao/log.js', () => ({
  log: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn() },
}));
vi.mock('chalk', () => ({ default: { bold: (x: string) => x, yellow: (x: string) => x } }));
vi.mock('../nucleo/constelacao/cosmos.js', () => ({ config: {} }));
vi.mock('../nucleo/inquisidor.js', () => ({
  iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
  executarInquisicao: vi.fn(async () => ({ ocorrencias: [] })),
  prepararComAst: vi.fn(async (e: any) => e),
  tecnicas: [],
}));
// detector retorna plano grande com conflitos
vi.mock('../analistas/detector-arquetipos.js', () => ({
  detectarArquetipos: vi.fn(async () => ({
    melhores: [
      {
        planoSugestao: {
          mover: Array.from({ length: 12 }, (_, i) => ({
            de: `src/a${i}.ts`,
            para: `src/b${i}.ts`,
          })),
          conflitos: [
            { caminho: 'x', motivo: 'existe' },
            { caminho: 'y', motivo: 'perm' },
          ],
        },
      },
    ],
  })),
}));
vi.mock('../zeladores/corretor-estrutura.js', () => ({
  corrigirEstrutura: vi.fn(async () => undefined),
}));

let log: any;
beforeEach(async () => {
  vi.resetModules();
  log = (await import('../nucleo/constelacao/log.js')).log;
});

describe('comando reestruturar branches extras', () => {
  it('plano com >10 movimentos e conflitos gera logs esperados com --aplicar', async () => {
    const { comandoReestruturar } = await import('./comando-reestruturar.js');
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    program.addCommand(comandoReestruturar(aplicarFlagsGlobais));
    await program.parseAsync(['node', 'cli', 'reestruturar', '--aplicar']);
    const infos = (log.info as any).mock.calls.map((c: any[]) => c.join(' ')).join('\n');
    const avisos = (log.aviso as any).mock.calls.map((c: any[]) => c.join(' ')).join('\n');
    expect(infos).toMatch(/12 movimentação/);
    expect(infos).toMatch(/\+2 restantes/); // 12 - mostra 10 e +2 restantes
    expect(avisos).toMatch(/Conflitos detectados: 2/);
  });
});
