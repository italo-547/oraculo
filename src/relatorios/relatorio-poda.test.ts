import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gerarRelatorioPodaMarkdown, gerarRelatorioPodaJson } from './relatorio-poda.js';

let salvarEstado: any;
beforeEach(async () => {
  vi.resetModules();
  vi.mock('../zeladores/util/persistencia.js', () => ({ salvarEstado: vi.fn() }));
  salvarEstado = (await import('../zeladores/util/persistencia.js')).salvarEstado;
});

describe('gerarRelatorioPodaMarkdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gera relatório markdown correto para podados e mantidos', async () => {
    const podados = [
      {
        arquivo: 'a.js',
        motivo: 'inativo',
        diasInativo: 10,
        detectedAt: Date.now(),
        scheduleAt: Date.now(),
      },
    ];
    const mantidos = [
      { arquivo: 'b.js', motivo: 'recente', detectedAt: Date.now(), scheduleAt: Date.now() },
    ];
    await gerarRelatorioPodaMarkdown('caminho.md', podados, mantidos);
    expect(salvarEstado).toHaveBeenCalledWith(
      'caminho.md',
      expect.stringMatching(/# 🌿 Relatório de Poda Oracular/),
    );
    const md = salvarEstado.mock.calls[0][1];
    expect(md).toMatch(/a\.js/);
    expect(md).toMatch(/b\.js/);
    expect(md).toMatch(/inativo/);
    expect(md).toMatch(/recente/);
    expect(md).toMatch(/\*\*Arquivos podados:\*\* 1/);
    expect(md).toMatch(/\*\*Arquivos mantidos:\*\* 1/);
  });

  it('gera relatório de simulação', async () => {
    await gerarRelatorioPodaMarkdown('caminho.md', [], [], { simulado: true });
    const md = salvarEstado.mock.calls[0][1];
    expect(md).toMatch(/\*\*Execução:\*\* Simulação/);
  });
});

describe('gerarRelatorioPodaJson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gera json correto', async () => {
    const podados = [
      {
        arquivo: 'a.js',
        motivo: 'inativo',
        diasInativo: 10,
        detectedAt: Date.now(),
        scheduleAt: Date.now(),
      },
    ];
    const mantidos = [
      { arquivo: 'b.js', motivo: 'recente', detectedAt: Date.now(), scheduleAt: Date.now() },
    ];
    await gerarRelatorioPodaJson('caminho.json', podados, mantidos);
    expect(salvarEstado).toHaveBeenCalledWith(
      'caminho.json',
      expect.objectContaining({
        podados: expect.any(Array),
        mantidos: expect.any(Array),
        totalPodados: 1,
        totalMantidos: 1,
        timestamp: expect.any(Number),
      }),
    );
    const json = salvarEstado.mock.calls[0][1];
    expect(json.podados[0].arquivo).toBe('a.js');
    expect(json.mantidos[0].arquivo).toBe('b.js');
    expect(json.podados[0].diasInativo).toBe(10);
  });
});
