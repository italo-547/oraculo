// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

beforeEach(() => {
  vi.resetModules();
});

describe('comando-diagnosticar — Guardian AlteracoesDetectadas incrementa totalOcorrencias', () => {
  it('quando status é AlteracoesDetectadas, avisa e contabiliza 1 ocorrência adicional', async () => {
    const logMock = {
      info: vi.fn(),
      sucesso: vi.fn(),
      aviso: vi.fn(),
      erro: vi.fn(),
      fase: vi.fn(),
      infoDestaque: vi.fn(),
      imprimirBloco: vi.fn(),
    };
    vi.doMock('../nucleo/constelacao/log.js', () => ({ log: logMock }));
    vi.doMock('chalk', () => ({ default: { bold: (x: any) => x, cyan: { bold: (x: any) => x } } }));

    const fakeEntries = [{ relPath: 'f.ts', fullPath: process.cwd() + '/f.ts', content: 'x' }];
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: fakeEntries })),
      prepararComAst: vi.fn(async (e: any) => e.map((x: any) => ({ ...x, ast: undefined }))),
      executarInquisicao: vi.fn(async () => ({ ocorrencias: [], fileEntries: fakeEntries })),
      registrarUltimasMetricas: vi.fn(),
      tecnicas: [],
    }));
    vi.doMock('../guardian/sentinela.js', () => ({
      scanSystemIntegrity: vi.fn(async () => ({ status: 'alteracoes-detectadas' })),
    }));
    vi.doMock('../nucleo/constelacao/cosmos.js', () => ({
      config: {
        GUARDIAN_ENABLED: true,
        GUARDIAN_ENFORCE_PROTECTION: false,
        VERBOSE: false,
        COMPACT_MODE: true,
        REPORT_EXPORT_ENABLED: false,
      },
    }));

    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const prog = new Command();
    prog.addCommand(comandoDiagnosticar(() => {}));
    await prog.parseAsync(['node', 'cli', 'diagnosticar', '--guardian-check']);

    // Deve registrar aviso das alterações e no final, como há 1 ocorrência total, cair no caminho de problemas
    expect(logMock.aviso).toHaveBeenCalledWith(expect.stringContaining('alterações suspeitas'));
  });
});
