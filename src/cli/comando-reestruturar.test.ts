import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { comandoReestruturar } from './comando-reestruturar.js';

vi.mock('../nucleo/constelacao/log.js', () => ({
    log: {
        info: vi.fn(),
        sucesso: vi.fn(),
        aviso: vi.fn(),
        erro: vi.fn(),
    },
}));
vi.mock('chalk', () => ({ default: { bold: (x: string) => x, yellow: (x: string) => x } }));
vi.mock('../nucleo/constelacao/cosmos.js', () => ({ config: {} }));
vi.mock('../nucleo/inquisidor.js', () => ({
    iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
    executarInquisicao: vi.fn(async () => ({ ocorrencias: [] })),
    tecnicas: [],
}));
vi.mock('../zeladores/corretor-estrutura.js', () => ({ corrigirEstrutura: vi.fn(async () => undefined) }));

let log: any;
beforeEach(async () => {
    vi.resetModules();
    log = (await import('../nucleo/constelacao/log.js')).log;
});

describe('comandoReestruturar', () => {
    it('executa reestruturação e informa repositório otimizado', async () => {
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const cmd = comandoReestruturar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await program.parseAsync(['node', 'cli', 'reestruturar']);
        expect(log.info).toHaveBeenCalledWith(expect.stringMatching(/Iniciando processo de reestruturação/));
        expect(log.sucesso).toHaveBeenCalledWith(expect.stringMatching(/Repositório já otimizado/));
        expect(aplicarFlagsGlobais).toHaveBeenCalled();
    });
});
