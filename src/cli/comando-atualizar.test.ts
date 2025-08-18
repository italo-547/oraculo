// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';

let log: any;
let execSync: any;
let config: any;
let scanSystemIntegrity: any;
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
  vi.doMock('../nucleo/constelacao/cosmos.js', () => ({ config: {} }));
  vi.doMock('../nucleo/inquisidor.js', () => ({
    iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
  }));
  scanSystemIntegrity = vi.fn(async () => ({ status: 'ok' }));
  vi.doMock('../guardian/sentinela.js', () => ({
    scanSystemIntegrity,
  }));
  execSync = vi.fn();
  vi.doMock('node:child_process', () => ({ execSync }));
  log = (await import('../nucleo/constelacao/log.js')).log;
  config = (await import('../nucleo/constelacao/cosmos.js')).config;
  exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('exit');
  });
});

afterEach(() => {
  exitSpy.mockRestore();
});

describe('comandoAtualizar', () => {
  it('executa atualização padrão com integridade ok', async () => {
    const { comandoAtualizar } = await import('./comando-atualizar.js');
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    const cmd = comandoAtualizar(aplicarFlagsGlobais);
    program.addCommand(cmd);
    await program.parseAsync(['node', 'cli', 'atualizar']);
    expect(log.info).toHaveBeenCalledWith(
      expect.stringMatching(/Iniciando processo de atualização/),
    );
    expect(log.sucesso).toHaveBeenCalledWith(expect.stringMatching(/Atualização concluída/));
    expect(aplicarFlagsGlobais).toHaveBeenCalled();
    expect(execSync).toHaveBeenCalledWith('npm install oraculo@latest', { stdio: 'inherit' });
  });

  it('executa atualização global com --global', async () => {
    const { comandoAtualizar } = await import('./comando-atualizar.js');
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    const cmd = comandoAtualizar(aplicarFlagsGlobais);
    program.addCommand(cmd);
    await program.parseAsync(['node', 'cli', 'atualizar', '--global']);
    expect(execSync).toHaveBeenCalledWith('npm install -g oraculo@latest', { stdio: 'inherit' });
    expect(log.sucesso).toHaveBeenCalledWith(expect.stringMatching(/Atualização concluída/));
  });

  it('avisa quando Guardian retorna baseline novo ou alterações', async () => {
    scanSystemIntegrity.mockResolvedValueOnce({ status: 'baseline-criado' });
    const { comandoAtualizar } = await import('./comando-atualizar.js');
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    const cmd = comandoAtualizar(aplicarFlagsGlobais);
    program.addCommand(cmd);
    await program.parseAsync(['node', 'cli', 'atualizar']);
    expect(log.aviso).toHaveBeenCalledWith(
      expect.stringMatching(/Guardian gerou novo baseline|detectou alterações/i),
    );
    expect(log.info).toHaveBeenCalledWith(expect.stringMatching(/oraculo guardian --diff/));
    expect(execSync).toHaveBeenCalled();
  });

  it('trata erro e mostra mensagem de erro', async () => {
    scanSystemIntegrity.mockImplementationOnce(() => {
      throw new Error('falha de integridade');
    });
    const { comandoAtualizar } = await import('./comando-atualizar.js');
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    const cmd = comandoAtualizar(aplicarFlagsGlobais);
    program.addCommand(cmd);
    try {
      await program.parseAsync(['node', 'cli', 'atualizar']);
    } catch (e) {
      // esperado por causa do process.exit
    }
    expect(log.erro).toHaveBeenCalledWith(expect.stringMatching(/Atualização abortada|falhou/));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('trata erro com detalhes e DEV_MODE', async () => {
    config.DEV_MODE = true;
    const detalhes = ['detalhe1', 'detalhe2'];
    const erro = { detalhes };
    scanSystemIntegrity.mockImplementationOnce(() => {
      throw erro;
    });
    const { comandoAtualizar } = await import('./comando-atualizar.js');
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    const cmd = comandoAtualizar(aplicarFlagsGlobais);
    program.addCommand(cmd);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await program.parseAsync(['node', 'cli', 'atualizar']);
    } catch (e) {
      // esperado por causa do process.exit
    }
    expect(log.erro).toHaveBeenCalledWith(expect.stringMatching(/Atualização abortada|falhou/));
    expect(log.aviso).toHaveBeenCalledWith(expect.stringMatching(/detalhe1/));
    expect(log.aviso).toHaveBeenCalledWith(expect.stringMatching(/detalhe2/));
    expect(consoleError).toHaveBeenCalledWith(erro);
    expect(exitSpy).toHaveBeenCalledWith(1);
    consoleError.mockRestore();
  });
});
