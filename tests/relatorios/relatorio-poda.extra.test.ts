// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gerarRelatorioPodaMarkdown } from '../../src/relatorios/relatorio-poda.js';

// Extra: força caminhos de listas vazias (podados e mantidos) cobrindo ramos não exercitados.

let salvarEstado: any;

describe('relatorio-poda (extra)', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.mock('../../src/zeladores/util/persistencia.js', () => ({ salvarEstado: vi.fn() }));
    salvarEstado = (await import('../../src/zeladores/util/persistencia.js')).salvarEstado;
  });

  it('gera markdown com mensagens de vazio quando não há podados ou mantidos', async () => {
    await gerarRelatorioPodaMarkdown('out.md', [], []);
    const md = salvarEstado.mock.calls[0][1] as string;
    expect(md).toMatch(/Nenhum arquivo foi podado/);
    expect(md).toMatch(/Nenhum arquivo mantido/);
  });
});
