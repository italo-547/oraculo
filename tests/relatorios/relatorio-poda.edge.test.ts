// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gerarRelatorioPodaMarkdown } from '../../src/relatorios/relatorio-poda.js';

let salvarEstado: any;

describe('relatorio-poda (edge casos)', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.mock('../../src/zeladores/util/persistencia.js', () => ({ salvarEstado: vi.fn() }));
    salvarEstado = (await import('../../src/zeladores/util/persistencia.js')).salvarEstado;
  });

  it('markdown com zero podados e zero mantidos já coberto; aqui diasInativo numérico zero', async () => {
    await gerarRelatorioPodaMarkdown(
      'out.md',
      [
        {
          arquivo: 'a.js',
          motivo: 'm',
          diasInativo: 0,
          detectedAt: Date.now(),
          scheduleAt: Date.now(),
        },
      ] as any,
      [] as any,
    );
    const md = salvarEstado.mock.calls[0][1] as string;
    expect(md).toMatch(/\| a.js \| m \| 0 \|/);
  });
});
