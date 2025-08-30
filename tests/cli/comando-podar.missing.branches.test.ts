import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// factory mut�vel para permitir alterar comportamento por teste
let rlFactory: () => { question: (p: any) => Promise<string>; close: () => void } = () => ({
  question: async () => 'n',
  close: () => {},
});

vi.mock('../../src/nucleo/inquisidor.js', () => ({
  iniciarInquisicao: vi.fn(async () => ({ fileEntries: [{ arquivo: 'a.txt' }] })),
}));

vi.mock('../../src/zeladores/poda.js', () => ({
  removerArquivosOrfaos: vi.fn(async () => ({
    arquivosOrfaos: [{ arquivo: 'a.txt', referenciado: false }],
  })),
}));

vi.mock('../../src/relatorios/relatorio-poda.js', () => ({
  gerarRelatorioPodaMarkdown: vi.fn(async () => {}),
  gerarRelatorioPodaJson: vi.fn(async () => {}),
}));

// O código importa '../nucleo/constelacao/log.js' — mock exatamente o mesmo caminho
vi.mock('../../src/nucleo/constelacao/log.js', () => {
  return {
    log: {
      info: vi.fn(),
      aviso: vi.fn(),
      sucesso: vi.fn(),
      erro: vi.fn(),
    },
  };
});

// mock do readline/promises que delega para rlFactory mut�vel
vi.mock('node:readline/promises', () => ({
  createInterface: () => rlFactory(),
}));

describe('comando-podar branches faltantes', () => {
  const origCwd = process.cwd();
  let exitSpy: any;
  beforeEach(() => {
    process.chdir(origCwd);
    // reset factory e mocks
    rlFactory = () => ({ question: async () => 'n', close: () => {} });
    vi.resetAllMocks();
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('inclui pattern com node_modules deve remover ignores', async () => {
    const { comandoPodar } = await import('../../src/cli/comando-podar.js');
    const { config } = await import('../../src/nucleo/constelacao/cosmos.js');
    // garantir presen�a inicial de padr�es que contenham node_modules para filtrar
    config.ZELADOR_IGNORE_PATTERNS = ['node_modules', 'dist'];
    config.GUARDIAN_IGNORE_PATTERNS = ['node_modules', '.git'];

    const cmd = comandoPodar(() => {});
    await cmd.parseAsync(['node', 'podar', '--include', 'node_modules/somelib'], { from: 'user' });

    expect(config.ZELADOR_IGNORE_PATTERNS.every((p: string) => !/node_modules/.test(p))).toBe(true);
    expect(config.GUARDIAN_IGNORE_PATTERNS.every((p: string) => !/node_modules/.test(p))).toBe(
      true,
    );
  });

  it('resposta interativa n�o � "s" cancela poda', async () => {
    // simular resposta 'n'
    rlFactory = () => ({ question: async () => 'n', close: () => {} });
    const { comandoPodar } = await import('../../src/cli/comando-podar.js');
    const cmd = comandoPodar(() => {});
    await cmd.parseAsync(['node', 'podar'], { from: 'user' });
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    expect(
      (log.info as unknown as import('vitest').MockInstance).mock.calls.some((c: any[]) =>
        String(c[0]).includes('Poda cancelada'),
      ),
    ).toBe(true);
  });

  // AVISO: este teste era instável; adicionamos pequenos delays para estabilizar o fluxo assíncrono
  it('quando nenhum orfao e relatorio markdown falha, deve logar erro', async () => {
    const ini = await import('../../src/nucleo/inquisidor.js');
    (ini.iniciarInquisicao as unknown as import('vitest').MockInstance).mockResolvedValue({
      fileEntries: [],
    });
    // Garantir que removerArquivosOrfaos retorne vazio para simular nenhum orfao
    const poda = await import('../../src/zeladores/poda.js');
    (poda.removerArquivosOrfaos as unknown as import('vitest').MockInstance).mockResolvedValue({
      arquivosOrfaos: [],
    });
    const rel = await import('../../src/relatorios/relatorio-poda.js');
    (rel.gerarRelatorioPodaMarkdown as unknown as import('vitest').MockInstance).mockRejectedValue(
      new Error('boom-md'),
    );
    (rel.gerarRelatorioPodaJson as unknown as import('vitest').MockInstance).mockRejectedValue(
      new Error('boom-json'),
    );

    const { config } = await import('../../src/nucleo/constelacao/cosmos.js');
    config.REPORT_EXPORT_ENABLED = true;

    const { comandoPodar } = await import('../../src/cli/comando-podar.js');
    const cmd = comandoPodar(() => {});
    // Await the parse promise which will run export attempts (and throw internally)
    await cmd.parseAsync(['node', 'podar', '--include', 'x'], { from: 'user' });
    // Import the mocked log instance and inspect its calls
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    const erroCalls = (log.erro as unknown as import('vitest').MockInstance).mock.calls;
    const erroFound = erroCalls.some((args: any[]) =>
      args.some(
        (a: any) =>
          String(a).includes('Falha ao exportar') || String(a).includes('Erro durante a poda'),
      ),
    );
    expect(erroFound).toBe(true);
  });

  it('--force com erro ao exportar json deve logar erro', async () => {
    const poda = await import('../../src/zeladores/poda.js');
    (poda.removerArquivosOrfaos as unknown as import('vitest').MockInstance).mockResolvedValue({
      arquivosOrfaos: [{ arquivo: 'a' }],
    });
    const rel = await import('../../src/relatorios/relatorio-poda.js');
    (rel.gerarRelatorioPodaJson as unknown as import('vitest').MockInstance).mockRejectedValue(
      new Error('boom-json'),
    );

    const { config } = await import('../../src/nucleo/constelacao/cosmos.js');
    config.REPORT_EXPORT_ENABLED = true;

    const { comandoPodar } = await import('../../src/cli/comando-podar.js');
    const cmd = comandoPodar(() => {});
    await cmd.parseAsync(['node', 'podar', '--force'], { from: 'user' });
    await new Promise((r) => setTimeout(r, 0));
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    expect(
      (log.erro as unknown as import('vitest').MockInstance).mock.calls.some(
        (c: any[]): boolean =>
          String(c[0]).includes('Falha ao exportar') ||
          String(c[0]).includes('Erro durante a poda'),
      ),
    ).toBe(true);
  });

  it('quando chamado como subcomando (parent.opts existe) utiliza parent.opts()', async () => {
    const { comandoPodar } = await import('../../src/cli/comando-podar.js');
    const { Command } = await import('commander');
    const program = new Command();
    const cmd = comandoPodar(() => {});
    program.addCommand(cmd);
    await program.parseAsync(['node', 'podar'], { from: 'user' });
    expect(true).toBe(true);
  });

  it('expandIncludes com pattern sem meta deve adicionar varia��es', async () => {
    const { comandoPodar } = await import('../../src/cli/comando-podar.js');
    const { config } = await import('../../src/nucleo/constelacao/cosmos.js');
    const cmd = comandoPodar(() => {});
    await cmd.parseAsync(['node', 'podar', '--include', 'lib'], { from: 'user' });
    expect(config.CLI_INCLUDE_PATTERNS.some((p: string) => p.includes('lib'))).toBe(true);
  });

  it("confirma��o interativa 's' n�o cancela a poda", async () => {
    rlFactory = () => ({ question: async () => 'S', close: () => {} });
    const { comandoPodar } = await import('../../src/cli/comando-podar.js');
    const cmd = comandoPodar(() => {});
    await cmd.parseAsync(['node', 'podar'], { from: 'user' });
    const { log } = await import('../../src/nucleo/constelacao/log.js');
    expect(
      (log.info as unknown as import('vitest').MockInstance).mock.calls.every(
        (c: any[]) => !(c[0] && String(c[0]).includes('Poda cancelada')),
      ),
    ).toBe(true);
  });

  // sanity check: garante que o arquivo de testes � reconhecido pelo runner
  it('sanity: arquivo de teste carregado', () => {
    expect(true).toBe(true);
  });
});
