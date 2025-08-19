// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Este teste cobre o ramo "fora de VITEST" no scanner (usa lerArquivoTexto) e o caminho de erro no catch
describe('scanner — leitura de conteúdo fora de VITEST (branches)', () => {
  const tmpBase = path.join(os.tmpdir(), `oraculo-scan-nonvitest-${Date.now()}`);
  const fileOk = path.join(tmpBase, 'ok.txt');
  const fileBad = path.join(tmpBase, 'bad.txt');

  const oldEnv = { ...process.env } as any;
  let originalVitest: string | undefined;
  let originalReportSilence: boolean | undefined;
  let originalScanOnly: boolean | undefined;

  beforeAll(async () => {
    await fs.mkdir(tmpBase, { recursive: true });
    await fs.writeFile(fileOk, 'conteudo-ok', 'utf-8');
    await fs.writeFile(fileBad, 'conteudo-bad', 'utf-8');

    // Força caminho "não VITEST" apenas dentro deste arquivo de teste
    originalVitest = (process.env as any).VITEST;
    delete (process.env as any).VITEST;

    // Silencia logs do scanner
    const { config } = await import('../nucleo/constelacao/cosmos');
    originalReportSilence = config.REPORT_SILENCE_LOGS;
    originalScanOnly = config.SCAN_ONLY;
    config.REPORT_SILENCE_LOGS = true;
    config.SCAN_ONLY = false;
  });

  afterAll(async () => {
    // Restaura ambiente e config
    process.env = oldEnv;
    const { config } = await import('../nucleo/constelacao/cosmos');
    if (typeof originalReportSilence !== 'undefined')
      config.REPORT_SILENCE_LOGS = originalReportSilence;
    if (typeof originalScanOnly !== 'undefined') config.SCAN_ONLY = originalScanOnly;
    // Cleanup
    await fs.rm(tmpBase, { recursive: true, force: true });
  });

  it('lê conteúdo via lerArquivoTexto e captura erro no catch', async () => {
    // Espiona lerArquivoTexto para lançar em um arquivo específico
    const persist = await import('../zeladores/util/persistencia');
    const lerArquivoTextoSpy = vi.spyOn(persist, 'lerArquivoTexto');
    lerArquivoTextoSpy.mockImplementation(async (p: string) => {
      if (p.endsWith('bad.txt')) throw new Error('falha-intencional');
      return 'LIDO:' + p.split(path.sep).pop();
    });

    const { scanRepository } = await import('./scanner');

    const logs: string[] = [];
    const mapa = await scanRepository(tmpBase, {
      includeContent: true,
      onProgress: (m) => logs.push(m),
    });

    // ok.txt deve ter conteúdo preenchido pelo mock, bad.txt deve estar presente com content null
    expect(mapa['ok.txt']?.content).toBe('LIDO:ok.txt');
    expect(mapa['bad.txt']?.content).toBeNull();

    // Deve ter sido logado um erro para bad.txt
    const temErroBad = logs.some((l) => {
      try {
        const j = JSON.parse(l as string);
        return j?.tipo === 'erro' && j?.acao === 'ler' && String(j?.caminho).endsWith('bad.txt');
      } catch {
        return false;
      }
    });
    expect(temErroBad).toBe(true);

    lerArquivoTextoSpy.mockRestore();
  });
});
