import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { comandoPodar } from './comando-podar.js';

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
}));
vi.mock('../zeladores/poda.js', () => ({
    removerArquivosOrfaos: vi.fn(async () => ({ arquivosOrfaos: [] })),
}));

let log: any;
beforeEach(async () => {
    vi.resetModules();
    log = (await import('../nucleo/constelacao/log.js')).log;
});

describe('comandoPodar', () => {
    it('executa poda e informa repositório limpo', async () => {
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const cmd = comandoPodar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await program.parseAsync(['node', 'cli', 'podar']);
        expect(log.info).toHaveBeenCalledWith(expect.stringMatching(/Iniciando processo de poda/));
        expect(log.sucesso).toHaveBeenCalledWith(expect.stringMatching(/Repositório limpo/));
        expect(aplicarFlagsGlobais).toHaveBeenCalled();
    });
});
