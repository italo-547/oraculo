// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

beforeEach(() => {
  vi.resetModules();
});

describe('comando-diagnosticar — listar-analistas largura default 96 (não-compacto)', () => {
  it('usa 96 colunas quando COMPACT_MODE=false e calcularLargura indefinida retorna undefined', async () => {
    const aplicar = vi.fn();
    const log: any = {
      info: vi.fn(),
      sucesso: vi.fn(),
      aviso: vi.fn(),
      erro: vi.fn(),
      imprimirBloco: vi.fn(),
      calcularLargura: (titulo: string, linhas: string[], base: number) => {
        expect(base).toBe(96);
        return undefined as any; // força fallback
      },
    };
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log }));
    // hoisted-safe mock: return only needed exports synchronously
    vi.doMock('../analistas/registry.js', () => ({
      listarAnalistas: () => [{ nome: 'X', categoria: 'core', descricao: 'd' }],
      registroAnalistas: [],
    }));
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [] })),
      prepararComAst: vi.fn(async () => []),
      executarInquisicao: vi.fn(async () => ({ ocorrencias: [] })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        DEV_MODE: true,
        VERBOSE: false,
        COMPACT_MODE: false,
        SCAN_ONLY: false,
        GUARDIAN_ENABLED: false,
        REPORT_EXPORT_ENABLED: false,
        GUARDIAN_BASELINE: 'baseline.json',
        ZELADOR_STATE_DIR: '.oraculo',
      },
    }));
    vi.doMock('chalk', () => ({
      default: { bold: (x: any) => x, cyan: Object.assign((x: any) => x, { bold: (y: any) => y }) },
    }));

    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const cmd = comandoDiagnosticar(aplicar);
    await cmd.parseAsync(['node', 'cli', 'diagnosticar', '--listar-analistas']);

    expect(log.imprimirBloco).toHaveBeenCalled();
    const largura = (log.imprimirBloco as any).mock.calls[0][3];
    expect(largura).toBe(96);
  });
});
