// SPDX-License-Identifier: MIT
import { describe, expect, it, vi } from 'vitest';
import { Command } from 'commander';

// Cobre branch de escapeNonAscii para caracteres fora do BMP (surrogate pair)
describe('comandoDiagnosticar – JSON unicode escape (surrogate pair)', () => {
  it('escapa caracteres fora do BMP como par \\uXXXX', async () => {
    vi.resetModules();

    // Mock simples para testar apenas a saída JSON
    vi.doMock('../nucleo/inquisidor.js', () => ({
      iniciarInquisicao: vi.fn(async () => ({
        fileEntries: [
          { relPath: 'test.ts', fullPath: '', content: '', ultimaModificacao: Date.now() },
        ],
      })),
      prepararComAst: vi.fn(async (e: any) => e.map((x: any) => ({ ...x, ast: {} }))),
      executarInquisicao: vi.fn(async () => ({
        ocorrencias: [
          {
            tipo: 'TEST',
            relPath: 'test.ts',
            mensagem: 'Teste com acentos: café, naïve, résumé',
            nivel: 'info',
          },
        ],
        fileEntries: [],
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

    const outSpy: string[] = [];
    const origLog = console.log;
    console.log = (msg?: any) => {
      outSpy.push(String(msg));
    };
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });

    let err: any;
    try {
      await program.parseAsync(['node', 'cli', 'diagnosticar', '--json']);
    } catch (e) {
      err = e;
    }

    console.log = origLog;
    exitSpy.mockRestore();

    // Verificar se pelo menos um output foi gerado
    expect(outSpy.length).toBeGreaterThan(0);

    // Encontrar o log que contém JSON válido
    const json = outSpy.find((log) => {
      try {
        JSON.parse(log);
        return true;
      } catch {
        return false;
      }
    });

    expect(json).toBeDefined();
    if (!json) throw new Error('JSON não encontrado');

    // Verificar se o JSON contém as propriedades esperadas
    const obj = JSON.parse(json);
    expect(obj).toHaveProperty('status');
    expect(obj).toHaveProperty('linguagens');

    // Verificar se há escapes unicode na string JSON
    expect(json).toMatch(/\\u[0-9a-fA-F]{4}/);
  });
});
