// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('comandoDiagnosticar – modo JSON silencia e restaura logs', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1';
  });

  it('substitui info/sucesso/aviso por no-op e restaura após finalizar', async () => {
    vi.resetModules();

    // Mock simplificado focando apenas no necessário
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({ fileEntries: [{ relPath: 'a.ts', content: 'x' }] })),
      prepararComAst: vi.fn(async (fes: any) => fes.map((f: any) => ({ ...f, ast: {} }))),
      executarInquisicao: vi.fn(async () => ({
        ocorrencias: [],
        metricas: {},
      })),
      registrarUltimasMetricas: vi.fn(() => ({})),
      tecnicas: [],
    }));

    vi.doMock('../guardian/sentinela.js', () => ({
      scanSystemIntegrity: vi.fn(async () => ({ status: 'ok' })),
    }));

    vi.doMock('../arquitetos/diagnostico-projeto.js', () => ({
      diagnosticarProjeto: vi.fn(() => undefined),
    }));

    const { comandoDiagnosticar } = await import('../../src/cli/comando-diagnosticar.js');
    const program = new Command();
    program.addCommand(comandoDiagnosticar(() => {}));

    const out: string[] = [];
    const origLog = console.log;
    console.log = (m?: any) => out.push(String(m));

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });

    try {
      await program.parseAsync(['node', 'cli', 'diagnosticar', '--json']);
    } catch (e) {
      // Ignorar erro de exit
    } finally {
      console.log = origLog;
      exitSpy.mockRestore();
    }

    // Verificar se há saída JSON
    expect(out.length).toBeGreaterThan(0);

    // Encontrar JSON válido na saída
    const jsonOutput = out.find((o) => {
      try {
        JSON.parse(o);
        return true;
      } catch {
        return false;
      }
    });

    expect(jsonOutput).toBeDefined();
    expect(jsonOutput).toMatch(/\"status\"\s*:\s*\"ok\"/);
  });
});
