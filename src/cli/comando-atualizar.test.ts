import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { comandoAtualizar } from './comando-atualizar.js';

vi.mock('../nucleo/constelacao/log.js', () => ({
    log: {
        info: vi.fn(),
        sucesso: vi.fn(),
        aviso: vi.fn(),
        erro: vi.fn(),
    },
}));
vi.mock('chalk', () => ({ default: { bold: (x: string) => x } }));
vi.mock('../nucleo/constelacao/cosmos.js', () => ({ config: {} }));
vi.mock('../nucleo/inquisidor.js', () => ({
    iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
}));
vi.mock('../guardian/sentinela.js', () => ({
    scanSystemIntegrity: vi.fn(async () => ({ status: 'ok' })),
}));
vi.mock('node:child_process', () => ({ execSync: vi.fn() }));

let log: any;
beforeEach(async () => {
    vi.resetModules();
    log = (await import('../nucleo/constelacao/log.js')).log;
});

describe('comandoAtualizar', () => {
    it('executa atualização padrão com integridade ok', async () => {
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const cmd = comandoAtualizar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await program.parseAsync(['node', 'cli', 'atualizar']);
        expect(log.info).toHaveBeenCalledWith(expect.stringMatching(/Iniciando processo de atualização/));
        expect(log.sucesso).toHaveBeenCalledWith(expect.stringMatching(/Atualização concluída/));
        expect(aplicarFlagsGlobais).toHaveBeenCalled();
    });
});
