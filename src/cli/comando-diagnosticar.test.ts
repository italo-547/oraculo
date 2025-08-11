import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { comandoDiagnosticar } from './comando-diagnosticar.js';

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

let log: any;
beforeEach(async () => {
    vi.resetModules();
    log = (await import('../nucleo/constelacao/log.js')).log;
});

describe('comandoDiagnosticar', () => {
    it('executa diagnóstico completo sem erros', async () => {
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await program.parseAsync(['node', 'cli', 'diagnosticar']);
        expect(log.info).toHaveBeenCalledWith(expect.stringMatching(/Iniciando diagnóstico completo/));
        expect(aplicarFlagsGlobais).toHaveBeenCalled();
    });

    it('executa diagnóstico com guardian-check e cobre todos os status', async () => {
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
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
        await expect(program.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check'])).rejects.toThrow('exit');
        expect(log.sucesso).toHaveBeenCalledWith(expect.stringContaining('Guardian: integridade preservada.'));
        expect(log.info).toHaveBeenCalledWith(expect.stringContaining('Guardian: baseline inicial criado.'));
        expect(log.aviso).toHaveBeenCalledWith(expect.stringContaining('Guardian: novo baseline aceito'));
        expect(log.aviso).toHaveBeenCalledWith(expect.stringContaining('Guardian: alterações suspeitas detectadas'));
        exitSpy.mockRestore();
    });

    it('executa diagnóstico com guardian-check e erro fatal', async () => {
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const { scanSystemIntegrity } = await import('../guardian/sentinela.js');
        const scanSystemIntegrityMock = vi.mocked(scanSystemIntegrity);
        scanSystemIntegrityMock.mockRejectedValueOnce({ detalhes: ['detalhe1', 'detalhe2'] });
        const { config } = await import('../nucleo/constelacao/cosmos.js');
        config.GUARDIAN_ENABLED = true;
        config.GUARDIAN_ENFORCE_PROTECTION = true;
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
        const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await expect(program.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check'])).rejects.toThrow('exit');
        expect(log.erro).toHaveBeenCalledWith(expect.stringContaining('Guardian bloqueou'));
        expect(log.aviso).toHaveBeenCalledWith(expect.stringContaining('detalhe1'));
        expect(log.aviso).toHaveBeenCalledWith(expect.stringContaining('detalhe2'));
        exitSpy.mockRestore();
    });

    it('executa diagnóstico com exportação de relatório', async () => {
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const { config } = await import('../nucleo/constelacao/cosmos.js');
        config.REPORT_EXPORT_ENABLED = true;
        const { gerarRelatorioMarkdown } = await import('../relatorios/gerador-relatorio.js');
        const { salvarEstado } = await import('../zeladores/util/persistencia.js');
        const { log } = await import('../nucleo/constelacao/log.js');
        const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await program.parseAsync(['node', 'cli', 'diagnosticar']);
        expect(gerarRelatorioMarkdown).toHaveBeenCalled();
        expect(salvarEstado).toHaveBeenCalled();
        expect(log.sucesso).toHaveBeenCalledWith(expect.stringContaining('Relatórios exportados para'));
        config.REPORT_EXPORT_ENABLED = false;
    });

    it('executa diagnóstico com ocorrências e aciona process.exit(1)', async () => {
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
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
        await expect(program.parseAsync(['node', 'cli', 'diagnosticar'])).rejects.toThrow('exit');
        expect(log.aviso).toHaveBeenCalledWith(expect.stringContaining('problema(s) detectado(s)'));
        exitSpy.mockRestore();
    });

    it('executa diagnóstico e lida com erro fatal (catch)', async () => {
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const { iniciarInquisicao } = await import('../nucleo/inquisidor.js');
        const iniciarInquisicaoMock = vi.mocked(iniciarInquisicao);
        iniciarInquisicaoMock.mockRejectedValueOnce(new Error('falha inquisicao'));
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
        const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await expect(program.parseAsync(['node', 'cli', 'diagnosticar'])).rejects.toThrow('exit');
        expect(log.erro).toHaveBeenCalledWith(expect.stringContaining('falha inquisicao'));
        exitSpy.mockRestore();
    });

    it('executa diagnóstico e lida com erro fatal em DEV_MODE', async () => {
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const { iniciarInquisicao } = await import('../nucleo/inquisidor.js');
        const iniciarInquisicaoMock = vi.mocked(iniciarInquisicao);
        iniciarInquisicaoMock.mockRejectedValueOnce(new Error('erro dev'));
        const { config } = await import('../nucleo/constelacao/cosmos.js');
        config.DEV_MODE = true;
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
        const cmd = comandoDiagnosticar(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await expect(program.parseAsync(['node', 'cli', 'diagnosticar'])).rejects.toThrow('exit');
        expect(log.erro).toHaveBeenCalledWith(expect.stringContaining('erro dev'));
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
        exitSpy.mockRestore();
        config.DEV_MODE = false;
    });
});
