import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comando-diagnosticar — scan-only exporta para diretório padrão quando REPORT_OUTPUT_DIR não definido', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('usa path.join(baseDir, "oraculo-reports") no scan-only quando REPORT_OUTPUT_DIR não é string', async () => {
    const hoisted = vi.hoisted(() => ({
      logMock: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn() } as any,
      createdDirs: [] as string[],
      saved: [] as string[],
    }));
    vi.mock('../nucleo/constelacao/log.js', () => ({ log: hoisted.logMock }));

    vi.mock('node:fs', () => ({
      default: {
        promises: {
          mkdir: vi.fn(async (dir: string) => {
            hoisted.createdDirs.push(dir);
          }),
        },
      },
      promises: {
        mkdir: vi.fn(async (dir: string) => {
          hoisted.createdDirs.push(dir);
        }),
      },
    }));

    // salvarEstado para capturar caminho de saída
    vi.mock('../zeladores/util/persistencia.js', () => ({
      salvarEstado: vi.fn(async (dest: string) => {
        hoisted.saved.push(dest);
      }),
    }));

    vi.mock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        SCAN_ONLY: true,
        REPORT_EXPORT_ENABLED: true,
        // REPORT_OUTPUT_DIR ausente/indefinido
        COMPACT_MODE: false,
        VERBOSE: false,
        DEV_MODE: false,
        GUARDIAN_BASELINE: 'guardian-baseline.json',
        ZELADOR_STATE_DIR: 'inc-state',
      },
    }));
    vi.mock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: async () => ({ fileEntries: [{ relPath: 'a.ts', content: 'x' }] }),
      prepararComAst: async (f: any) => f,
      executarInquisicao: async () => ({ ocorrencias: [], metricas: undefined }),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));

    const { comandoDiagnosticar } = await import('./comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));
    await program.parseAsync(['node', 'cli', 'diagnosticar']);

    // Deve ter criado diretório padrão
    expect(hoisted.createdDirs.some((d) => d.includes('oraculo-reports'))).toBe(true);
    // E salvado um .json dentro dele
    expect(hoisted.saved.some((p) => p.includes('oraculo-reports') && p.endsWith('.json'))).toBe(
      true,
    );
    expect(hoisted.logMock.sucesso).toHaveBeenCalledWith(
      expect.stringContaining('Relatório de scan salvo'),
    );
  });
});
