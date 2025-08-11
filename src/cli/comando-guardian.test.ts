import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { comandoGuardian } from './comando-guardian.js';

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
    acceptNewBaseline: vi.fn(async () => undefined),
}));

let log: any;
beforeEach(async () => {
    vi.resetModules();
    log = (await import('../nucleo/constelacao/log.js')).log;
});

describe('comandoGuardian', () => {
    it('executa verificação padrão de integridade', async () => {
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const cmd = comandoGuardian(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await program.parseAsync(['node', 'cli', 'guardian']);
        expect(log.info).toHaveBeenCalledWith(expect.stringMatching(/Verificando integridade/));
        expect(aplicarFlagsGlobais).toHaveBeenCalled();
    });

    it('aceita novo baseline quando --accept-baseline', async () => {
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const cmd = comandoGuardian(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await program.parseAsync(['node', 'cli', 'guardian', '--accept-baseline']);
        expect(log.info).toHaveBeenCalledWith(expect.stringMatching(/Aceitando novo baseline/));
        expect(log.sucesso).toHaveBeenCalledWith(expect.stringMatching(/Novo baseline/));
    });
});
