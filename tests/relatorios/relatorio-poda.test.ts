/// <reference types="vitest" />
import path from 'node:path';
import { vi } from 'vitest';

// Usamos um mock que é criado antes de importar o módulo alvo, para garantir
// que o módulo em teste receba a função mockada (salvarEstado).
const salvarMock = vi.fn();
vi.mock('../../src/zeladores/util/persistencia.js', () => ({
  salvarEstado: (...args: any[]) => salvarMock(...args),
}));

describe('relatorio-poda', () => {
  beforeEach(() => {
    vi.resetModules();
    salvarMock.mockClear();
  });

  it('gera markdown com listas vazias e chama salvarEstado', async () => {
    const mod = await import('../../src/relatorios/relatorio-poda.js');
    const out = path.join(process.cwd(), '.oraculo', 'tmp-poda.md');
    await mod.gerarRelatorioPodaMarkdown(out, [], [], { simulado: true });
    expect(salvarMock).toHaveBeenCalled();
    const [caminho, conteudo] = salvarMock.mock.calls[0];
    expect(caminho).toBe(out);
    expect(typeof conteudo).toBe('string');
    expect(conteudo).toContain('Nenhum arquivo foi podado');
  });

  it('gera json e inclui campos esperados', async () => {
    salvarMock.mockClear();
    const mod = await import('../../src/relatorios/relatorio-poda.js');
    const out = path.join(process.cwd(), '.oraculo', 'tmp-poda.json');
    const podados = [{ arquivo: 'a.ts', motivo: 'x', diasInativo: 3 }];
    const mantidos = [{ arquivo: 'b.ts', motivo: 'y' }];
    await mod.gerarRelatorioPodaJson(out, podados as any, mantidos as any);
    expect(salvarMock).toHaveBeenCalled();
    const [caminho, json] = salvarMock.mock.calls[0];
    expect(caminho).toBe(out);
    expect(json.totalPodados).toBe(1);
    expect(json.podados[0].diasInativo).toBe(3);
  });
});
