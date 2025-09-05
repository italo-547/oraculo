// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';
import { executarInquisicao } from '../../src/nucleo/executor.js';
import { config } from '../../src/nucleo/constelacao/cosmos.js';

vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: { info: vi.fn(), erro: vi.fn(), sucesso: vi.fn(), aviso: vi.fn() },
}));

import { log } from '../../src/nucleo/constelacao/log.js';

describe('executor métricas', () => {
  it('emite eventos estruturados e métricas quando habilitado', async () => {
    config.ANALISE_METRICAS_ENABLED = true;
    config.LOG_ESTRUTURADO = true;
    const tecnica = {
      nome: 't1',
      global: false,
      test: () => true,
      aplicar: vi.fn().mockResolvedValue([{ tipo: 'X', mensagem: 'ok' }]),
    } as any;
    await executarInquisicao(
      [{ relPath: 'f.js', content: 'console.log(1)', fullPath: '/f.js', ast: null as any }],
      [tecnica],
      '/',
      {},
      { verbose: false },
    );
    const logs = (log.info as any).mock.calls.map((c: any[]) => c[0]);
    expect(logs.some((l: string) => /"tipo":"analista"/.test(l))).toBe(true);
    expect(logs.some((l: string) => /"tipo":"metricas"/.test(l))).toBe(true);
  });
});
