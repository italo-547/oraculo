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



    it('executa reestruturação com ocorrências e confirmação negativa', async () => {
        // Mock readline para resposta negativa ANTES de importar o comando
        vi.mock('node:readline/promises', () => ({
            createInterface: () => ({
                question: vi.fn(async () => 'n'),
                close: vi.fn(),
            }),
        }));
        // Importar dependências após mock
        const { comandoReestruturar } = await import('./comando-reestruturar.js');
        const { executarInquisicao } = await import('../nucleo/inquisidor.js');
        const executarInquisicaoMock = vi.mocked(executarInquisicao);
        executarInquisicaoMock.mockResolvedValueOnce({
            ocorrencias: [{ tipo: 'erro', relPath: 'c.ts', mensagem: 'msg' }],
            totalArquivos: 1,
            arquivosAnalisados: ['c.ts'],
            timestamp: Date.now(),
            duracaoMs: 1
        });
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const cmd = comandoReestruturar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await program.parseAsync(['node', 'cli', 'reestruturar']);
        const cancelada = (logger: any) => logger.mock.calls.some((call: any) => String(call[0]).includes('cancelada'));
        expect(
            cancelada(log.info) || cancelada(log.aviso) || cancelada(log.sucesso) || cancelada(log.erro)
        ).toBe(true);
    });

    it('executa reestruturação com --auto (sem confirmação)', async () => {
        const { comandoReestruturar } = await import('./comando-reestruturar.js');
        const { executarInquisicao } = await import('../nucleo/inquisidor.js');
        const executarInquisicaoMock = vi.mocked(executarInquisicao);
        executarInquisicaoMock.mockResolvedValueOnce({
            ocorrencias: [{ tipo: 'erro', relPath: 'c.ts', mensagem: 'msg' }],
            totalArquivos: 1,
            arquivosAnalisados: ['c.ts'],
            timestamp: Date.now(),
            duracaoMs: 1
        });
        const { corrigirEstrutura } = await import('../zeladores/corretor-estrutura.js');
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const cmd = comandoReestruturar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await program.parseAsync(['node', 'cli', 'reestruturar', '--auto']);
        expect(corrigirEstrutura).toHaveBeenCalled();
        expect(log.sucesso).toHaveBeenCalledWith(expect.stringContaining('correções aplicadas'));
    });

    it('executa reestruturação e lida com erro fatal (catch)', async () => {
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const { iniciarInquisicao } = await import('../nucleo/inquisidor.js');
        vi.mocked(iniciarInquisicao).mockRejectedValueOnce(new Error('falha inquisicao'));
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
        const cmd = comandoReestruturar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await expect(program.parseAsync(['node', 'cli', 'reestruturar'])).rejects.toThrow('exit');
        expect(log.erro).toHaveBeenCalledWith(expect.stringContaining('falha inquisicao'));
        exitSpy.mockRestore();
    });

    it('executa reestruturação e lida com erro fatal em DEV_MODE', async () => {
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const { iniciarInquisicao } = await import('../nucleo/inquisidor.js');
        vi.mocked(iniciarInquisicao).mockRejectedValueOnce(new Error('erro dev'));
        const { config } = await import('../nucleo/constelacao/cosmos.js');
        config.DEV_MODE = true;
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
        const cmd = comandoReestruturar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await expect(program.parseAsync(['node', 'cli', 'reestruturar'])).rejects.toThrow('exit');
        expect(log.erro).toHaveBeenCalledWith(expect.stringContaining('erro dev'));
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
        exitSpy.mockRestore();
        config.DEV_MODE = false;
    });
});
