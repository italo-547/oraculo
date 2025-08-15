import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

// Estado e spies hoisted para uso nos factories de vi.mock (que são hoisted)
const H = vi.hoisted(() => ({
  log: {
    info: vi.fn(),
    sucesso: vi.fn(),
    aviso: vi.fn(),
    erro: vi.fn(),
    fase: vi.fn(),
    imprimirBloco: vi.fn(),
    infoDestaque: vi.fn(),
  } as any,
  config: {
    DEV_MODE: true,
    VERBOSE: false,
    COMPACT_MODE: true,
    GUARDIAN_ENABLED: true,
    GUARDIAN_ENFORCE_PROTECTION: false,
    REPORT_SILENCE_LOGS: false,
    SCAN_ONLY: false,
    REPORT_EXPORT_ENABLED: true,
    REPORT_OUTPUT_DIR: 'out-relatorios' as string | undefined,
    GUARDIAN_BASELINE: 'baseline.json',
    ZELADOR_STATE_DIR: '.oraculo',
  },
  iniciarInqImpl: vi.fn(async (..._args: any[]) => ({
    fileEntries: [{ relPath: 'x.ts', fullPath: process.cwd() + '/x.ts', content: 'x' }],
  })),
  prepararComAstImpl: vi.fn(async (...args: any[]) => {
    const e = args[0] as any[];
    return e.map((x) => ({ ...x, ast: {} }));
  }),
  executarInqImpl: vi.fn(async (..._args: any[]) => ({
    ocorrencias: [{ tipo: 'A', mensagem: 'a', relPath: 'x.ts' }],
    metricas: undefined,
  })),
  scanIntegrityImpl: vi.fn(async (..._args: any[]) => ({
    status: 'ok',
    baselineModificado: false,
  })),
  detectarArquetiposImpl: vi.fn(async (..._args: any[]) => ({
    melhores: [],
    baseline: undefined,
    drift: undefined,
  })),
  gerarRelatorioImpl: vi.fn(async (..._args: any[]) => undefined),
  salvarEstadoImpl: vi.fn(async (..._args: any[]) => undefined),
  mkdirImpl: vi.fn(async (..._args: any[]) => undefined),
}));

// Mocks hoisted
vi.mock('../nucleo/constelacao/log.js', () => ({ log: H.log }));
vi.mock('chalk', () => {
  const bold = (x: any) => x;
  const cyan = Object.assign((x: any) => x, { bold });
  const yellow = Object.assign((x: any) => x, { bold });
  const green = Object.assign((x: any) => x, { bold });
  return { default: { bold, cyan, yellow, green } };
});
vi.mock('../nucleo/inquisidor.js', () => ({
  iniciarInquisicao: H.iniciarInqImpl,
  prepararComAst: H.prepararComAstImpl,
  executarInquisicao: H.executarInqImpl,
  tecnicas: [],
  registrarUltimasMetricas: vi.fn(),
}));
vi.mock('../guardian/sentinela.js', () => ({ scanSystemIntegrity: H.scanIntegrityImpl }));
vi.mock('../relatorios/gerador-relatorio.js', () => ({
  gerarRelatorioMarkdown: H.gerarRelatorioImpl,
}));
vi.mock('../zeladores/util/persistencia.js', () => ({ salvarEstado: H.salvarEstadoImpl }));
vi.mock('node:fs', () => ({ promises: { mkdir: H.mkdirImpl } }));
vi.mock('../analistas/detector-arquetipos.js', () => ({
  detectarArquetipos: H.detectarArquetiposImpl,
}));
vi.mock('../nucleo/constelacao/cosmos.js', () => ({ config: H.config }));

beforeEach(() => {
  vi.resetModules();
  // reset dos spies
  Object.values(H.log).forEach((fn: any) => typeof fn?.mockReset === 'function' && fn.mockReset());
  H.iniciarInqImpl.mockReset();
  H.prepararComAstImpl.mockReset();
  H.executarInqImpl.mockReset();
  H.scanIntegrityImpl.mockReset();
  H.detectarArquetiposImpl.mockReset();
  H.gerarRelatorioImpl.mockReset();
  H.salvarEstadoImpl.mockReset();
  H.mkdirImpl.mockReset();
  // defaults
  H.iniciarInqImpl.mockResolvedValue({
    fileEntries: [{ relPath: 'x.ts', fullPath: process.cwd() + '/x.ts', content: 'x' }],
  });
  H.prepararComAstImpl.mockImplementation(async (e: any[]) => e.map((x) => ({ ...x, ast: {} })));
  H.executarInqImpl.mockResolvedValue({
    ocorrencias: [{ tipo: 'A', mensagem: 'a', relPath: 'x.ts' }],
    metricas: undefined,
  });
  H.scanIntegrityImpl.mockResolvedValue({ status: 'ok', baselineModificado: false });
  H.detectarArquetiposImpl.mockResolvedValue({
    melhores: [],
    baseline: undefined,
    drift: undefined,
  });
  H.gerarRelatorioImpl.mockResolvedValue(undefined);
  H.salvarEstadoImpl.mockResolvedValue(undefined);
  H.mkdirImpl.mockResolvedValue(undefined);
  // config padrão
  H.config.DEV_MODE = true;
  H.config.VERBOSE = false;
  H.config.COMPACT_MODE = true;
  H.config.GUARDIAN_ENABLED = true;
  H.config.REPORT_EXPORT_ENABLED = true;
  H.config.REPORT_OUTPUT_DIR = 'out-relatorios';
});

describe('comando-diagnosticar — exportação (sucesso e erro) com variações de diretório', () => {
  it('exporta com diretório customizado e baselineModificado=false (sem JSON)', async () => {
    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check']);
    // confirma que houve log de sucesso (export ou guardian)
    expect(H.log.sucesso).toHaveBeenCalled();
  });

  it('falha ao exportar markdown ou json e registra erro', async () => {
    // Força erro na gravação do JSON
    H.salvarEstadoImpl.mockImplementationOnce(async () => {
      throw new Error('no space');
    });
    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check']);
    // Deve registrar erro (mensagem do catch global)
    expect(H.log.erro).toHaveBeenCalledWith(
      expect.stringContaining('Erro fatal durante o diagnóstico'),
    );
  });
});
