
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { comandoPodar } from './comando-podar.js';

// Mock readline para todos os testes, valor padrão 's' (confirma)
let readlineAnswer = 's';
vi.mock('node:readline/promises', () => ({
    createInterface: () => ({
        question: vi.fn(async () => readlineAnswer),
        close: vi.fn(),
    }),
}));
vi.mock('chalk', () => ({
    default: {
        bold: (x: string) => x,
        yellow: (x: string) => x,
        gray: (x: string) => x,
        cyan: (x: string) => x,
        green: (x: string) => x,
        red: (x: string) => x,
        magenta: (x: string) => x,
    }
}));
vi.mock('../nucleo/constelacao/cosmos.js', () => ({ config: {} }));
vi.mock('../nucleo/inquisidor.js', () => ({
    iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
}));
vi.mock('../zeladores/poda.js', () => ({
    removerArquivosOrfaos: vi.fn(async () => ({ arquivosOrfaos: [] })),
}));
vi.mock('../nucleo/constelacao/log.js', () => ({
    log: {
        info: vi.fn(),
        sucesso: vi.fn(),
        aviso: vi.fn(),
        erro: vi.fn(),
    },
}));

describe('comandoPodar', () => {
    afterEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it('log.sucesso é chamado quando não há arquivos órfãos', async () => {
        // Simula repositório limpo
        readlineAnswer = 's';
        const { removerArquivosOrfaos } = await import('../zeladores/poda.js');
        vi.mocked(removerArquivosOrfaos).mockResolvedValueOnce({ arquivosOrfaos: [] });
        const { log } = await import('../nucleo/constelacao/log.js');
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        program.addCommand(comandoPodar(aplicarFlagsGlobais));
        await program.parseAsync(['node', 'cli', 'podar']);
        expect(log.sucesso).toHaveBeenCalledWith(expect.stringContaining('Repositório limpo'));
    });


    it('log.info e log.aviso são chamados para arquivos órfãos', async () => {
        // Simula arquivos órfãos
        readlineAnswer = 's';
        const { removerArquivosOrfaos } = await import('../zeladores/poda.js');
        vi.mocked(removerArquivosOrfaos).mockResolvedValueOnce({ arquivosOrfaos: [{ arquivo: 'foo.txt', referenciado: false, diasInativo: 10 }] });
        const { log } = await import('../nucleo/constelacao/log.js');
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        program.addCommand(comandoPodar(aplicarFlagsGlobais));
        await program.parseAsync(['node', 'cli', 'podar']);
        expect(log.aviso).toHaveBeenCalledWith(expect.stringContaining('arquivos órfãos detectados'));
        expect(log.info).toHaveBeenCalledWith(expect.stringContaining('foo.txt'));
    });


    it('log.info é chamado para cancelamento explícito', async () => {
        // Simula arquivos órfãos e resposta negativa
        readlineAnswer = 'não';
        const { removerArquivosOrfaos } = await import('../zeladores/poda.js');
        vi.mocked(removerArquivosOrfaos).mockResolvedValueOnce({ arquivosOrfaos: [{ arquivo: 'foo.txt', referenciado: false, diasInativo: 10 }] });
        const { log } = await import('../nucleo/constelacao/log.js');
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        program.addCommand(comandoPodar(aplicarFlagsGlobais));
        await program.parseAsync(['node', 'cli', 'podar']);
        expect(log.info).toHaveBeenCalledWith(expect.stringContaining('Poda cancelada'));
    });


    it('log.sucesso é chamado após remoção com --force', async () => {
        // Simula arquivos órfãos e --force
        readlineAnswer = 'não';
        const { removerArquivosOrfaos } = await import('../zeladores/poda.js');
        vi.mocked(removerArquivosOrfaos).mockResolvedValueOnce({ arquivosOrfaos: [{ arquivo: 'foo.txt', referenciado: false, diasInativo: 10 }] });
        const { log } = await import('../nucleo/constelacao/log.js');
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        program.addCommand(comandoPodar(aplicarFlagsGlobais));
        await program.parseAsync(['node', 'cli', 'podar', '--force']);
        expect(log.sucesso).toHaveBeenCalledWith(expect.stringContaining('Arquivos órfãos removidos'));
    });

    it('cobre o catch de erro inesperado (throw string)', async () => {
        const { iniciarInquisicao } = await import('../nucleo/inquisidor.js');
        vi.mocked(iniciarInquisicao).mockRejectedValueOnce('erro string');
        const { log } = await import('../nucleo/constelacao/log.js');
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
        program.addCommand(comandoPodar(aplicarFlagsGlobais));
        await expect(program.parseAsync(['node', 'cli', 'podar'])).rejects.toThrow('exit');
        expect(log.erro).toHaveBeenCalledWith(expect.stringContaining('erro string'));
        exitSpy.mockRestore();
    });

    it('remove arquivos órfãos com --force sem confirmação', async () => {
        // Simula --force: não deve perguntar nada
        readlineAnswer = 'não';
        const { removerArquivosOrfaos } = await import('../zeladores/poda.js');
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        program.addCommand(comandoPodar(aplicarFlagsGlobais));
        await program.parseAsync(['node', 'cli', 'podar', '--force']);
        expect(removerArquivosOrfaos).toHaveBeenCalled();
    });

    it('remove arquivos órfãos após confirmação positiva', async () => {
        // Simula resposta positiva do usuário
        readlineAnswer = 's';
        const { removerArquivosOrfaos } = await import('../zeladores/poda.js');
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        program.addCommand(comandoPodar(aplicarFlagsGlobais));
        await program.parseAsync(['node', 'cli', 'podar']);
        expect(removerArquivosOrfaos).toHaveBeenCalled();
    });

    it('não remove arquivos se confirmação for negativa', async () => {
        // Simula resposta negativa do usuário
        readlineAnswer = 'não';
        const { removerArquivosOrfaos } = await import('../zeladores/poda.js');
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        program.addCommand(comandoPodar(aplicarFlagsGlobais));
        await program.parseAsync(['node', 'cli', 'podar']);
        // Deve ser chamado apenas uma vez (para listar), não para remoção
        expect(removerArquivosOrfaos).toHaveBeenCalledTimes(1);
    });

    it('executa poda e lida com erro fatal (catch)', async () => {
        const { log } = await import('../nucleo/constelacao/log.js');
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const { iniciarInquisicao } = await import('../nucleo/inquisidor.js');
        vi.mocked(iniciarInquisicao).mockRejectedValueOnce(new Error('falha inquisicao'));
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
        const cmd = comandoPodar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await expect(program.parseAsync(['node', 'cli', 'podar'])).rejects.toThrow('exit');
        expect(log.erro).toHaveBeenCalledWith(expect.stringContaining('falha inquisicao'));
        exitSpy.mockRestore();
    });

    it('executa poda e lida com erro fatal em DEV_MODE', async () => {
        const { log } = await import('../nucleo/constelacao/log.js');
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const { iniciarInquisicao } = await import('../nucleo/inquisidor.js');
        vi.mocked(iniciarInquisicao).mockRejectedValueOnce(new Error('erro dev'));
        const { config } = await import('../nucleo/constelacao/cosmos.js');
        config.DEV_MODE = true;
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
        const cmd = comandoPodar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await expect(program.parseAsync(['node', 'cli', 'podar'])).rejects.toThrow('exit');
        expect(log.erro).toHaveBeenCalledWith(expect.stringContaining('erro dev'));
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
        exitSpy.mockRestore();
        config.DEV_MODE = false;
    });
});
