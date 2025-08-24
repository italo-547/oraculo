// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  gerarRelatorioPodaMarkdown,
  gerarRelatorioPodaJson,
} from '../../src/relatorios/relatorio-poda.js';

let salvarEstado: any;

describe('relatorio-poda (branches)', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.mock('../../src/zeladores/util/persistencia.js', () => ({ salvarEstado: vi.fn() }));
    salvarEstado = (await import('../../src/zeladores/util/persistencia.js')).salvarEstado;
  });

  it('markdown usa diasInativo "-" quando não numérico', async () => {
    await gerarRelatorioPodaMarkdown(
      'out.md',
      [
        { arquivo: 'a.js', motivo: 'm', detectedAt: Date.now(), scheduleAt: Date.now() },
        {
          arquivo: 'b.js',
          motivo: 'm',
          diasInativo: 12,
          detectedAt: Date.now(),
          scheduleAt: Date.now(),
        },
      ] as any,
      [{ arquivo: 'c.js', motivo: 'k', detectedAt: Date.now(), scheduleAt: Date.now() }] as any,
    );
    const md = salvarEstado.mock.calls.find((c: any[]) => c[0] === 'out.md')[1] as string;
    // a.js sem diasInativo numerico => '-'
    expect(md).toMatch(/\| a.js \| m \| - \|/);
    // b.js com numero
    expect(md).toMatch(/\| b.js \| m \| 12 \|/);
  });

  it('json omite diasInativo quando não numérico', async () => {
    await gerarRelatorioPodaJson(
      'out.json',
      [{ arquivo: 'x.js', motivo: 'm', detectedAt: Date.now(), scheduleAt: Date.now() }] as any,
      [] as any,
    );
    const jsonCall = salvarEstado.mock.calls.find((c: any[]) => c[0] === 'out.json');
    expect(jsonCall).toBeTruthy();
    const json = jsonCall[1];
    expect(json.podados[0].diasInativo).toBeUndefined();
  });
});
