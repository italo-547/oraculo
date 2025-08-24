// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executarInquisicao } from '../../src/nucleo/executor.js';
import { config } from '../../src/nucleo/constelacao/cosmos.js';
import { promises as fs } from 'node:fs';

vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: { info: vi.fn(), erro: vi.fn(), sucesso: vi.fn(), aviso: vi.fn() },
}));

import { log } from '../../src/nucleo/constelacao/log.js';

function entry(rel: string, content: string) {
  return { relPath: rel, content, fullPath: rel, ast: null as any } as any;
}

describe('executor incremental', () => {
  beforeEach(async () => {
    try {
      await fs.unlink(config.ANALISE_INCREMENTAL_STATE_PATH);
    } catch {}
    (log.info as any).mockClear();
  });

  it('reaproveita ocorrencias quando hash igual', async () => {
    config.ANALISE_INCREMENTAL_ENABLED = true;
    const tecnica = {
      nome: 't',
      global: false,
      test: () => true,
      aplicar: vi.fn().mockResolvedValue([{ tipo: 'X', mensagem: 'm', relPath: 'a.js' }]),
    } as any;
    // Primeira execução (gera estado)
    const r1 = await executarInquisicao([entry('a.js', 'console.log(1)')], [tecnica], '/', {});
    expect(r1.ocorrencias.length).toBe(1);
    // Segunda execução (mesmo conteúdo) deve reutilizar
    const aplicarAntes = tecnica.aplicar.mock.calls.length;
    const r2 = await executarInquisicao(
      [entry('a.js', 'console.log(1)')],
      [tecnica],
      '/',
      {},
      { verbose: true },
    );
    expect(r2.ocorrencias.length).toBe(1);
    expect(tecnica.aplicar.mock.calls.length).toBe(aplicarAntes); // não chamou de novo
    const infos = (log.info as any).mock.calls.map((c: any[]) => c[0]);
    expect(infos.some((m: string) => /Reaproveitado a.js/.test(m))).toBe(true);
    // Verifica estatísticas persistidas
    const estadoRaw = await fs.readFile(config.ANALISE_INCREMENTAL_STATE_PATH, 'utf-8');
    const estado = JSON.parse(estadoRaw);
    expect(estado.estatisticas.totalReaproveitamentos).toBeGreaterThanOrEqual(1);
    expect(estado.arquivos['a.js'].analistas.t.ocorrencias).toBe(1);
  });

  it('reprocessa quando conteúdo muda', async () => {
    config.ANALISE_INCREMENTAL_ENABLED = true;
    const tecnica = {
      nome: 't',
      global: false,
      test: () => true,
      aplicar: vi.fn().mockResolvedValue([{ tipo: 'Y', mensagem: 'm', relPath: 'b.js' }]),
    } as any;
    await executarInquisicao([entry('b.js', '1')], [tecnica], '/', {});
    const chamadas1 = tecnica.aplicar.mock.calls.length;
    await executarInquisicao([entry('b.js', '2')], [tecnica], '/', {});
    expect(tecnica.aplicar.mock.calls.length).toBeGreaterThan(chamadas1);
    const estadoRaw = await fs.readFile(config.ANALISE_INCREMENTAL_STATE_PATH, 'utf-8');
    const estado = JSON.parse(estadoRaw);
    // Estado reflete apenas a última execução (1 arquivo processado novamente)
    expect(estado.estatisticas.totalArquivosProcessados).toBeGreaterThanOrEqual(1);
  });
});
