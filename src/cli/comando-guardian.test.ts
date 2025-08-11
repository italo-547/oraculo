
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';


describe('comandoGuardian', () => {
    let log: any;
    let exitSpy: any;

    beforeEach(async () => {
        vi.resetModules();
        vi.doMock('../nucleo/constelacao/log.js', () => ({
            log: {
                info: vi.fn(),
                sucesso: vi.fn(),
                aviso: vi.fn(),
                erro: vi.fn(),
            },
        }));
        vi.doMock('chalk', () => ({ default: { bold: (x: string) => x } }));
        vi.doMock('../nucleo/constelacao/cosmos.js', () => ({ config: { GUARDIAN_BASELINE: 'baseline-test.json', ZELADOR_STATE_DIR: 'state-test-dir' } }));
        vi.doMock('../nucleo/inquisidor.js', () => ({
            iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
        }));
        exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
        log = (await import('../nucleo/constelacao/log.js')).log;
    });
    afterEach(() => {
        exitSpy.mockRestore();
    });

    it('executa verificação padrão de integridade (status ok)', async () => {
        vi.doMock('../guardian/sentinela.js', () => ({
            scanSystemIntegrity: vi.fn(async () => ({ status: 'ok' })),
            acceptNewBaseline: vi.fn(async () => undefined),
        }));
        const { comandoGuardian } = await import('./comando-guardian.js');
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const cmd = comandoGuardian(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await program.parseAsync(['node', 'cli', 'guardian']);
        expect(log.info).toHaveBeenCalledWith(expect.stringMatching(/Verificando integridade/));
        expect(log.sucesso).toHaveBeenCalledWith(expect.stringMatching(/integridade preservada/));
        expect(aplicarFlagsGlobais).toHaveBeenCalled();
    });

    it('aceita novo baseline quando --accept-baseline', async () => {
        const acceptNewBaselineMock = vi.fn(async () => undefined);
        vi.doMock('../guardian/sentinela.js', () => ({
            scanSystemIntegrity: vi.fn(async () => ({ status: 'ok' })),
            acceptNewBaseline: acceptNewBaselineMock,
        }));
        const { comandoGuardian } = await import('./comando-guardian.js');
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const cmd = comandoGuardian(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await program.parseAsync(['node', 'cli', 'guardian', '--accept-baseline']);
        expect(log.info.mock.calls.flat()).toEqual(
            expect.arrayContaining([
                expect.stringMatching(/aceitando.+baseline/i)
            ])
        );
        expect(log.sucesso.mock.calls.flat()).toEqual(
            expect.arrayContaining([
                expect.stringMatching(/novo baseline/i)
            ])
        );
        expect(acceptNewBaselineMock).toHaveBeenCalled();
    });

    it('mostra diferenças quando --diff e há alterações', async () => {
        vi.doMock('../guardian/sentinela.js', () => ({
            scanSystemIntegrity: vi.fn(async () => ({ status: 'alteracoes-detectadas', detalhes: ['arquivo1.ts', 'arquivo2.ts'] })),
            acceptNewBaseline: vi.fn(async () => undefined),
        }));
        const { comandoGuardian } = await import('./comando-guardian.js');
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const cmd = comandoGuardian(aplicarFlagsGlobais);
        program.addCommand(cmd);
        try {
            await program.parseAsync(['node', 'cli', 'guardian', '--diff']);
        } catch (e) {
            // esperado por causa do process.exit
        }
        // Verifica se pelo menos um log.info contém "Comparando" e os arquivos
        const infoCalls = log.info.mock.calls.flat().join('\n');
        expect(infoCalls).toMatch(/comparando.+integridade/i);
        expect(infoCalls).toMatch(/arquivo1\.ts/);
        expect(infoCalls).toMatch(/arquivo2\.ts/);
        expect(log.aviso.mock.calls.flat().join('\n')).toMatch(/diferenças detectadas/i);
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('mostra sucesso quando --diff e não há alterações', async () => {
        vi.doMock('../guardian/sentinela.js', () => ({
            scanSystemIntegrity: vi.fn(async () => ({ status: 'ok', detalhes: [] })),
            acceptNewBaseline: vi.fn(async () => undefined),
        }));
        const { comandoGuardian } = await import('./comando-guardian.js');
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const cmd = comandoGuardian(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await program.parseAsync(['node', 'cli', 'guardian', '--diff']);
        expect(log.sucesso).toHaveBeenCalledWith(expect.stringContaining('Nenhuma diferença'));
    });

    it('status Criado mostra instruções de aceitação', async () => {
        vi.doMock('../guardian/sentinela.js', () => ({
            scanSystemIntegrity: vi.fn(async () => ({ status: 'baseline-criado' })),
            acceptNewBaseline: vi.fn(async () => undefined),
        }));
        const { comandoGuardian } = await import('./comando-guardian.js');
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const cmd = comandoGuardian(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await program.parseAsync(['node', 'cli', 'guardian']);
        const infoCalls = log.info.mock.calls.flat().join('\n');
        const avisoCalls = log.aviso.mock.calls.flat().join('\n');
        expect(infoCalls).toMatch(/baseline inicial criado/i);
        expect(avisoCalls).toMatch(/aceit[áa]-lo/i);
    });

    it('status Aceito mostra mensagem de aceitação', async () => {
        vi.doMock('../guardian/sentinela.js', () => ({
            scanSystemIntegrity: vi.fn(async () => ({ status: 'baseline-aceito' })),
            acceptNewBaseline: vi.fn(async () => undefined),
        }));
        const { comandoGuardian } = await import('./comando-guardian.js');
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const cmd = comandoGuardian(aplicarFlagsGlobais);
        program.addCommand(cmd);
        await program.parseAsync(['node', 'cli', 'guardian']);
        expect(log.sucesso.mock.calls.flat()).toEqual(
            expect.arrayContaining([
                expect.stringMatching(/baseline.+aceito|atualizado/i)
            ])
        );
    });

    it('status AlteracoesDetectadas mostra alerta e sai', async () => {
        vi.doMock('../guardian/sentinela.js', () => ({
            scanSystemIntegrity: vi.fn(async () => ({ status: 'alteracoes-detectadas' })),
            acceptNewBaseline: vi.fn(async () => undefined),
        }));
        const { comandoGuardian } = await import('./comando-guardian.js');
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const cmd = comandoGuardian(aplicarFlagsGlobais);
        program.addCommand(cmd);
        try {
            await program.parseAsync(['node', 'cli', 'guardian']);
        } catch (e) {
            // esperado por causa do process.exit
        }
        const avisoCalls = log.aviso.mock.calls.flat().join('\n');
        expect(avisoCalls).toMatch(/alterações suspeitas/i);
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('trata erro e mostra mensagem de erro', async () => {
        vi.doMock('../guardian/sentinela.js', () => ({
            scanSystemIntegrity: vi.fn(() => { throw new Error('falha de integridade'); }),
            acceptNewBaseline: vi.fn(async () => undefined),
        }));
        const { comandoGuardian } = await import('./comando-guardian.js');
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const cmd = comandoGuardian(aplicarFlagsGlobais);
        program.addCommand(cmd);
        try {
            await program.parseAsync(['node', 'cli', 'guardian']);
        } catch (e) {
            // esperado por causa do process.exit
        }
        const erroCalls = log.erro.mock.calls.flat().join('\n');
        expect(erroCalls).toMatch(/falha de integridade/i);
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('trata erro e mostra mensagem de erro detalhado em DEV_MODE', async () => {
        // Força DEV_MODE true
        vi.doMock('../nucleo/constelacao/cosmos.js', () => ({ config: { DEV_MODE: true } }));
        const erro = new Error('erro detalhado');
        vi.doMock('../guardian/sentinela.js', () => ({
            scanSystemIntegrity: vi.fn(() => { throw erro; }),
            acceptNewBaseline: vi.fn(async () => undefined),
        }));
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
        const { comandoGuardian } = await import('./comando-guardian.js');
        const program = new Command();
        const aplicarFlagsGlobais = vi.fn();
        const cmd = comandoGuardian(aplicarFlagsGlobais);
        program.addCommand(cmd);
        try {
            await program.parseAsync(['node', 'cli', 'guardian']);
        } catch (e) {
            // esperado por causa do process.exit
        }
        expect(consoleError).toHaveBeenCalledWith(erro);
        expect(exitSpy).toHaveBeenCalledWith(1);
        consoleError.mockRestore();
    });
});
