import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

beforeEach(() => {
  vi.resetModules();
});

describe('comando-diagnosticar — json: surrogate pair e sem_ext + metricas.topAnalistas', () => {
  it('escapa pares substitutos (emoji) e conta sem_ext; inclui topAnalistas', async () => {
    const aplicarFlagsGlobais = vi.fn();

    const fakeEntries = [
      { relPath: 'README', fullPath: process.cwd() + '/README', content: 'text' }, // sem ext
    ];

    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: fakeEntries })),
      prepararComAst: vi.fn(async (fes: any) => fes.map((f: any) => ({ ...f, ast: undefined }))),
      executarInquisicao: vi.fn(async () => ({
        ocorrencias: [
          { tipo: 'PARSE_ERRO', relPath: 'README', mensagem: 'falha 🧠', nivel: 'erro' },
        ],
        metricas: {
          totalArquivos: 1,
          tempoAnaliseMs: 10,
          tempoParsingMs: 4,
          cacheAstHits: 0,
          cacheAstMiss: 0,
          analistas: [
            { nome: 'A', duracaoMs: 5, ocorrencias: 1, global: false },
            { nome: 'B', duracaoMs: 3, ocorrencias: 0, global: false },
          ],
        },
      })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    vi.doMock('../analistas/detector-arquetipos.js', () => ({
      detectarArquetipos: vi.fn(async () => undefined),
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        GUARDIAN_ENABLED: false,
        GUARDIAN_BASELINE: 'baseline.json',
        ZELADOR_STATE_DIR: '.oraculo',
        VERBOSE: false,
        COMPACT_MODE: true,
        SCAN_ONLY: false,
        REPORT_EXPORT_ENABLED: false,
        REPORT_SILENCE_LOGS: false,
        PARSE_ERRO_FALHA: true,
      },
    }));
    const log = { info: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), erro: vi.fn() } as any;
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log }));

    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(aplicarFlagsGlobais));

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'cli', 'diagnosticar', '--json']);
    const out = spy.mock.calls.at(-1)?.[0] as string;

    expect(out).toMatch(/\\ud83e\\udde0/); // 🧠
    const parsed = JSON.parse(out);
    expect(parsed.linguagens.extensoes.sem_ext).toBe(1);
    expect(parsed.metricas.topAnalistas[0].nome).toBe('A');
    spy.mockRestore();
  });
});
