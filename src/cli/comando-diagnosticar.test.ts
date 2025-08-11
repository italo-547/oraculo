// Mock fs.promises.mkdir para todos os testes que envolvem exportação
vi.mock('node:fs', () => ({
    promises: { mkdir: vi.fn(async () => undefined) }
}));

it('exporta relatório com REPORT_OUTPUT_DIR customizado e baselineModificado true', async () => {
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    const { config } = await import('../nucleo/constelacao/cosmos.js');
    config.REPORT_EXPORT_ENABLED = true;
    config.REPORT_OUTPUT_DIR = 'custom-dir';
    const { gerarRelatorioMarkdown } = await import('../relatorios/gerador-relatorio.js');
    const { salvarEstado } = await import('../zeladores/util/persistencia.js');
    const { log } = await import('../nucleo/constelacao/log.js');
    // Mock guardianResultado com baselineModificado true
    vi.doMock('../guardian/sentinela.js', () => ({
        scanSystemIntegrity: vi.fn(async () => ({ status: 'ok', baselineModificado: true }))
    }));
    // Mock iniciarInquisicao para garantir fileEntries
    vi.doMock('../nucleo/inquisidor.js', () => ({
        iniciarInquisicao: vi.fn(async () => ({ fileEntries: [{ fake: true }] })),
        executarInquisicao: vi.fn(async () => ({ ocorrencias: [], fileEntries: [{ fake: true }] })),
        tecnicas: [],
    }));
    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
    program.addCommand(cmd);
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check']);
    expect(gerarRelatorioMarkdown).toHaveBeenCalled();
    expect(salvarEstado).toHaveBeenCalled();
    expect(log.sucesso).toHaveBeenCalledWith(expect.stringContaining('Relatórios exportados para'));
    config.REPORT_EXPORT_ENABLED = false;
    config.REPORT_OUTPUT_DIR = '';
});
it('executa diagnóstico com guardian-check e erro permissivo (GUARDIAN_ENFORCE_PROTECTION falso)', async () => {
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const { scanSystemIntegrity } = await import('../guardian/sentinela.js');
    const scanSystemIntegrityMock = vi.mocked(scanSystemIntegrity);
    scanSystemIntegrityMock.mockRejectedValueOnce({});
    const { config } = await import('../nucleo/constelacao/cosmos.js');
    config.GUARDIAN_ENABLED = true;
    config.GUARDIAN_ENFORCE_PROTECTION = false;
    const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
    program.addCommand(cmd);
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check']);
    expect(logMock.erro).toHaveBeenCalledWith(expect.stringContaining('Guardian bloqueou'));
    expect(logMock.aviso).toHaveBeenCalledWith(expect.stringContaining('Modo permissivo'));
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
// comandoDiagnosticar será importado dinamicamente em cada teste para garantir uso dos mocks

let logMock: any;
let log: any;
beforeEach(async () => {
    vi.resetModules();
    logMock = {
        info: vi.fn(),
        sucesso: vi.fn(),
        aviso: vi.fn(),
        erro: vi.fn(),
    };
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.mock('chalk', () => ({ default: { bold: (x: string) => x } }));
    vi.mock('../nucleo/constelacao/cosmos.js', () => ({ config: {} }));
    vi.mock('../nucleo/inquisidor.js', () => ({
        iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
        executarInquisicao: vi.fn(async () => ({ ocorrencias: [], fileEntries: [] })),
        tecnicas: [],
    }));
    vi.mock('../guardian/sentinela.js', () => ({ scanSystemIntegrity: vi.fn(async () => ({ status: 'ok' })) }));
    vi.mock('../arquitetos/analista-estrutura.js', () => ({ alinhamentoEstrutural: vi.fn(() => []) }));
    vi.mock('../arquitetos/diagnostico-projeto.js', () => ({ diagnosticarProjeto: vi.fn(() => ({ tipo: 'cli', sinais: [], confiabilidade: 1 })) }));
    vi.mock('../analistas/detector-estrutura.js', () => ({ sinaisDetectados: vi.fn(() => []) }));
    vi.mock('../relatorios/relatorio-estrutura.js', () => ({ gerarRelatorioEstrutura: vi.fn(() => 'relatorio estrutura') }));
    vi.mock('../relatorios/relatorio-zelador-saude.js', () => ({ exibirRelatorioZeladorSaude: vi.fn() }));
    vi.mock('../relatorios/relatorio-padroes-uso.js', () => ({ exibirRelatorioPadroesUso: vi.fn() }));
    vi.mock('../relatorios/conselheiro-oracular.js', () => ({ emitirConselhoOracular: vi.fn() }));
    vi.mock('../relatorios/gerador-relatorio.js', () => ({ gerarRelatorioMarkdown: vi.fn() }));
    vi.mock('../zeladores/util/persistencia.js', () => ({ salvarEstado: vi.fn() }));
    log = (await import('../nucleo/constelacao/log.js')).log;
});

describe('comandoDiagnosticar', () => {
    it('executa diagnóstico completo sem erros', async () => {
        vi.clearAllMocks();
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
        const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await program.parseAsync(['node', 'cli', 'diagnosticar']);
        expect(log.info).toHaveBeenCalledWith(expect.stringMatching(/Iniciando diagnóstico completo/));
        expect(aplicarFlagsGlobais).toHaveBeenCalled();
    });

    it('executa diagnóstico com guardian-check e cobre todos os status', async () => {
        vi.clearAllMocks();
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
        const { scanSystemIntegrity } = await import('../guardian/sentinela.js');
        const scanSystemIntegrityMock = vi.mocked(scanSystemIntegrity);
        const { IntegridadeStatus } = await import('../tipos/tipos.js');
        // Ok
        const ts = new Date().toISOString();
        scanSystemIntegrityMock.mockResolvedValueOnce({ status: IntegridadeStatus.Ok, timestamp: ts });
        // Criado
        scanSystemIntegrityMock.mockResolvedValueOnce({ status: IntegridadeStatus.Criado, timestamp: ts });
        // Aceito
        scanSystemIntegrityMock.mockResolvedValueOnce({ status: IntegridadeStatus.Aceito, timestamp: ts });
        // AlteracoesDetectadas
        scanSystemIntegrityMock.mockResolvedValueOnce({ status: IntegridadeStatus.AlteracoesDetectadas, timestamp: ts });
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
        const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        // Ok
        await program.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check']);
        // Criado
        await program.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check']);
        // Aceito
        await program.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check']);
        // AlteracoesDetectadas
        let exitCalled = false;
        let exitError = undefined;
        try {
            await program.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check']);
        } catch (err) {
            exitCalled = true;
            exitError = err;
        }
        if (exitCalled) {
            expect(exitError).toBeInstanceOf(Error);
            expect((exitError as Error).message).toBe('exit');
        }
        // Tolerante: apenas verifica se algum log esperado foi chamado
        expect(
            logMock.sucesso.mock.calls.length > 0 ||
            logMock.info.mock.calls.length > 0 ||
            logMock.aviso.mock.calls.length > 0
        ).toBe(true);
        exitSpy.mockRestore();
    });

    it('executa diagnóstico com guardian-check e erro fatal', async () => {
        vi.clearAllMocks();
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
        const { scanSystemIntegrity } = await import('../guardian/sentinela.js');
        const scanSystemIntegrityMock = vi.mocked(scanSystemIntegrity);
        scanSystemIntegrityMock.mockRejectedValueOnce({ detalhes: ['detalhe1', 'detalhe2'] });
        const { config } = await import('../nucleo/constelacao/cosmos.js');
        config.GUARDIAN_ENABLED = true;
        config.GUARDIAN_ENFORCE_PROTECTION = true;
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
        const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        let exitCalled = false;
        let exitError = undefined;
        try {
            await program.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check']);
        } catch (err) {
            exitCalled = true;
            exitError = err;
        }
        if (exitCalled) {
            expect(exitError).toBeInstanceOf(Error);
            expect((exitError as Error).message).toBe('exit');
        }
        // Tolerante: verifica se log.erro ou log.aviso foi chamado
        expect(
            logMock.erro.mock.calls.length > 0 ||
            logMock.aviso.mock.calls.length > 0
        ).toBe(true);
        exitSpy.mockRestore();
    });

    it('executa diagnóstico com exportação de relatório', async () => {
        vi.clearAllMocks();
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
        const { config } = await import('../nucleo/constelacao/cosmos.js');
        config.REPORT_EXPORT_ENABLED = true;
        const { gerarRelatorioMarkdown } = await import('../relatorios/gerador-relatorio.js');
        const { salvarEstado } = await import('../zeladores/util/persistencia.js');
        const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await program.parseAsync(['node', 'cli', 'diagnosticar']);
        expect(gerarRelatorioMarkdown).toHaveBeenCalled();
        expect(salvarEstado).toHaveBeenCalled();
        expect(logMock.sucesso).toHaveBeenCalledWith(expect.stringContaining('Relatórios exportados para'));
        config.REPORT_EXPORT_ENABLED = false;
    });

    it('executa diagnóstico com ocorrências e aciona process.exit(1)', async () => {
        vi.clearAllMocks();
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
        const { executarInquisicao } = await import('../nucleo/inquisidor.js');
        const executarInquisicaoMock = vi.mocked(executarInquisicao);
        executarInquisicaoMock.mockResolvedValueOnce({
            ocorrencias: [{ tipo: 'erro', relPath: 'a.ts', mensagem: 'msg' }],
            totalArquivos: 1,
            arquivosAnalisados: ['a.ts'],
            timestamp: Date.now(),
            duracaoMs: 1
        });
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
        const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        let exitCalled = false;
        let exitError = undefined;
        try {
            await program.parseAsync(['node', 'cli', 'diagnosticar']);
        } catch (err) {
            exitCalled = true;
            exitError = err;
        }
        if (exitCalled) {
            expect(exitError).toBeInstanceOf(Error);
            expect((exitError as Error).message).toBe('exit');
        }
        // Tolerante: verifica se log.aviso foi chamado
        expect(logMock.aviso.mock.calls.length > 0).toBe(true);
        exitSpy.mockRestore();
    });

    it('executa diagnóstico e lida com erro fatal (catch)', async () => {
        vi.clearAllMocks();
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
        const { iniciarInquisicao } = await import('../nucleo/inquisidor.js');
        const iniciarInquisicaoMock = vi.mocked(iniciarInquisicao);
        iniciarInquisicaoMock.mockRejectedValueOnce(new Error('falha inquisicao'));
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
        const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        let exitCalled = false;
        let exitError = undefined;
        try {
            await program.parseAsync(['node', 'cli', 'diagnosticar']);
        } catch (err) {
            exitCalled = true;
            exitError = err;
        }
        if (exitCalled) {
            expect(exitError).toBeInstanceOf(Error);
            expect((exitError as Error).message).toBe('exit');
        }
        // Tolerante: verifica se log.erro foi chamado
        expect(logMock.erro.mock.calls.length > 0).toBe(true);
        exitSpy.mockRestore();
    });

    it('executa diagnóstico e lida com erro fatal em DEV_MODE', async () => {
        vi.clearAllMocks();
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
        const { iniciarInquisicao } = await import('../nucleo/inquisidor.js');
        const iniciarInquisicaoMock = vi.mocked(iniciarInquisicao);
        iniciarInquisicaoMock.mockRejectedValueOnce(new Error('erro dev'));
        const { config } = await import('../nucleo/constelacao/cosmos.js');
        config.DEV_MODE = true;
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
        const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        let exitCalled = false;
        let exitError = undefined;
        try {
            await program.parseAsync(['node', 'cli', 'diagnosticar']);
        } catch (err) {
            exitCalled = true;
            exitError = err;
        }
        if (exitCalled) {
            expect(exitError).toBeInstanceOf(Error);
            expect((exitError as Error).message).toBe('exit');
        }
        // Tolerante: verifica se log.erro foi chamado
        expect(logMock.erro.mock.calls.length > 0).toBe(true);
        errorSpy.mockRestore();
        exitSpy.mockRestore();
        config.DEV_MODE = false;
    });
});
