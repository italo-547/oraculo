// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';

// Mock readline para todos os testes, valor padrão 's' (confirma)
let readlineAnswer = 's';
vi.mock('node:readline/promises', () => ({
  createInterface: () => ({
    question: vi.fn(async () => readlineAnswer),
    close: vi.fn(),
  }),
}));
vi.mock('chalk', () => ({ default: { bold: (x: string) => x, yellow: (x: string) => x } }));
vi.mock('../../src/nucleo/constelacao/cosmos.js', () => ({ config: {} }));
vi.mock('../../src/nucleo/inquisidor.js', () => ({
  iniciarInquisicao: vi.fn(async () => ({
    fileEntries: [{ fullPath: 'src/a.ts', relPath: 'src/a.ts' }],
  })),
  executarInquisicao: vi.fn(async () => ({ ocorrencias: [] })),
  prepararComAst: vi.fn(async (entries: any) => entries),
  tecnicas: [],
}));
vi.mock('../../src/analistas/detector-arquetipos.js', () => ({
  detectarArquetipos: vi.fn(async () => ({
    melhores: [{ planoSugestao: { mover: [], conflitos: [], resumo: '' } }],
  })),
}));
vi.mock('../../src/zeladores/corretor-estrutura.js', () => ({
  corrigirEstrutura: vi.fn(async () => undefined),
}));
vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: {
    info: vi.fn(),
    sucesso: vi.fn(),
    aviso: vi.fn(),
    erro: vi.fn(),
  },
}));

let log: any;
beforeEach(async () => {
  vi.resetModules();
  log = (await import('../../src/nucleo/constelacao/log.js')).log;
});

describe('comandoReestruturar', () => {
  it('executa reestruturação e informa repositório otimizado', async () => {
    const { comandoReestruturar } = await import('../../src/cli/comando-reestruturar.js');
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    // detector retorna plano vazio e executarInquisicao retorna sem ocorrências
    const cmd = comandoReestruturar(aplicarFlagsGlobais);
    program.addCommand(cmd);
    await program.parseAsync(['node', 'cli', 'reestruturar']);
    expect(log.info).toHaveBeenCalledWith(
      expect.stringMatching(/Iniciando processo de reestruturação/),
    );
    expect(log.sucesso).toHaveBeenCalledWith(expect.stringMatching(/Repositório já otimizado/));
    expect(aplicarFlagsGlobais).toHaveBeenCalled();
  });

  it('executa reestruturação com ocorrências e confirmação negativa', async () => {
    // Simula resposta negativa do usuário via variável de ambiente
    const originalEnv = process.env.ORACULO_REESTRUTURAR_ANSWER;
    process.env.ORACULO_REESTRUTURAR_ANSWER = 'n';

    const { comandoReestruturar } = await import('../../src/cli/comando-reestruturar.js');
    const { executarInquisicao } = await import('../../src/nucleo/inquisidor.js');
    const executarInquisicaoMock = vi.mocked(executarInquisicao);
    executarInquisicaoMock.mockResolvedValueOnce({
      ocorrencias: [{ tipo: 'erro', relPath: 'c.ts', mensagem: 'msg' }],
      totalArquivos: 1,
      arquivosAnalisados: ['c.ts'],
      timestamp: Date.now(),
      duracaoMs: 1,
    });
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    const cmd = comandoReestruturar(aplicarFlagsGlobais);
    program.addCommand(cmd);

    // O comando deve rejeitar com 'exit:1' quando cancelado
    await expect(program.parseAsync(['node', 'cli', 'reestruturar'])).rejects.toThrow('exit:1');

    // Verifica se o log de cancelamento foi chamado
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('cancelada'));

    // Restaura variável de ambiente
    if (originalEnv !== undefined) {
      process.env.ORACULO_REESTRUTURAR_ANSWER = originalEnv;
    } else {
      delete process.env.ORACULO_REESTRUTURAR_ANSWER;
    }
  });

  it('executa reestruturação com --auto (sem confirmação)', async () => {
    const { comandoReestruturar } = await import('../../src/cli/comando-reestruturar.js');
    const { executarInquisicao } = await import('../../src/nucleo/inquisidor.js');
    const executarInquisicaoMock = vi.mocked(executarInquisicao);
    executarInquisicaoMock.mockResolvedValueOnce({
      ocorrencias: [{ tipo: 'erro', relPath: 'c.ts', mensagem: 'msg' }],
      totalArquivos: 1,
      arquivosAnalisados: ['c.ts'],
      timestamp: Date.now(),
      duracaoMs: 1,
    });
    const { corrigirEstrutura } = await import('../../src/zeladores/corretor-estrutura.js');
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    const cmd = comandoReestruturar(aplicarFlagsGlobais);
    program.addCommand(cmd);
    await program.parseAsync(['node', 'cli', 'reestruturar', '--auto']);
    expect(corrigirEstrutura).toHaveBeenCalled();
    expect(log.sucesso).toHaveBeenCalledWith(expect.stringContaining('correções aplicadas'));
  });

  it('executa reestruturação manual com confirmação positiva (usuário responde s)', async () => {
    // Simula resposta positiva do usuário
    readlineAnswer = 's';
    const { comandoReestruturar } = await import('../../src/cli/comando-reestruturar.js');
    const { executarInquisicao } = await import('../../src/nucleo/inquisidor.js');
    const executarInquisicaoMock = vi.mocked(executarInquisicao);
    executarInquisicaoMock.mockResolvedValueOnce({
      ocorrencias: [{ tipo: 'erro', relPath: 'c.ts', mensagem: 'msg' }],
      totalArquivos: 1,
      arquivosAnalisados: ['c.ts'],
      timestamp: Date.now(),
      duracaoMs: 1,
    });
    const { corrigirEstrutura } = await import('../../src/zeladores/corretor-estrutura.js');
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    const cmd = comandoReestruturar(aplicarFlagsGlobais);
    program.addCommand(cmd);
    await program.parseAsync(['node', 'cli', 'reestruturar']);
    expect(corrigirEstrutura).toHaveBeenCalled();
    expect(log.sucesso).toHaveBeenCalledWith(expect.stringContaining('correções aplicadas'));
  });

  it.skip('executa reestruturação e lida com erro fatal (catch)', async () => {
    const { comandoReestruturar } = await import('../../src/cli/comando-reestruturar.js');
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    const { iniciarInquisicao } = await import('../../src/nucleo/inquisidor.js');
    vi.mocked(iniciarInquisicao).mockRejectedValueOnce(new Error('falha inquisicao'));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const cmd = comandoReestruturar(aplicarFlagsGlobais);
    program.addCommand(cmd);
    await expect(program.parseAsync(['node', 'cli', 'reestruturar'])).rejects.toThrow('exit');
    expect(log.erro).toHaveBeenCalledWith(expect.stringContaining('falha inquisicao'));
    exitSpy.mockRestore();
  }, 10000); // Aumenta timeout para 10s

  it.skip('executa reestruturação e lida com erro fatal em DEV_MODE', async () => {
    const { comandoReestruturar } = await import('../../src/cli/comando-reestruturar.js');
    const program = new Command();
    const aplicarFlagsGlobais = vi.fn();
    const { iniciarInquisicao } = await import('../../src/nucleo/inquisidor.js');
    vi.mocked(iniciarInquisicao).mockRejectedValueOnce(new Error('erro dev'));
    const { config } = await import('../../src/nucleo/constelacao/cosmos.js');
    config.DEV_MODE = true;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const cmd = comandoReestruturar(aplicarFlagsGlobais);
    program.addCommand(cmd);
    await expect(program.parseAsync(['node', 'cli', 'reestruturar'])).rejects.toThrow('exit');
    expect(log.erro).toHaveBeenCalledWith(expect.stringContaining('erro dev'));
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
    exitSpy.mockRestore();
    config.DEV_MODE = false;
  }, 10000); // Aumenta timeout para 10s
});
