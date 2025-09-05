/// <reference types="vitest" />
import { vi } from 'vitest';
import path from 'node:path';

// Mock de persistência criado antes de importar o módulo em teste
const salvarMock = vi.fn();
vi.mock('../../src/zeladores/util/persistencia.js', () => ({
  salvarEstado: (...args: any[]) => salvarMock(...args),
}));

describe('gerador-relatorio', () => {
  beforeEach(() => {
    vi.resetModules();
    salvarMock.mockClear();
  });

  it('gera markdown com header e linhas de ocorrencias ordenadas', async () => {
    const mod = await import('../../src/relatorios/gerador-relatorio.js');
    const resultado = {
      totalArquivos: 3,
      ocorrencias: [
        { relPath: 'b.ts', linha: 5, nivel: 'warn', mensagem: 'x | y' },
        { relPath: 'a.ts', linha: 10, nivel: 'error', mensagem: 'z' },
        { relPath: 'a.ts', linha: 2, nivel: 'info', mensagem: 'ok' },
      ],
      guardian: { status: 'ok', timestamp: 123, totalArquivos: 3 },
      timestamp: 1600000000000,
      duracaoMs: 1500,
    } as any;

    const out = path.join(process.cwd(), '.oraculo', 'tmp-gerador.md');
    await mod.gerarRelatorioMarkdown(resultado, out);

    expect(salvarMock).toHaveBeenCalled();
    const [caminho, conteudo] = salvarMock.mock.calls[0];
    expect(caminho).toBe(out);
    // header básico
    expect(conteudo).toContain('# 🧾 Relatório Oráculo');
    expect(conteudo).toContain('**Arquivos escaneados:** 3');
    // guardian fields (formatado com negrito)
    expect(conteudo).toContain('**Status:** ok');
    expect(conteudo).toContain('**Total de arquivos protegidos:** 3');
    // ocorrencias ordenadas: a.ts linha 2, a.ts linha 10, b.ts linha 5
    const idxA2 = conteudo.indexOf('a.ts | 2');
    const idxA10 = conteudo.indexOf('a.ts | 10');
    const idxB5 = conteudo.indexOf('b.ts | 5');
    expect(idxA2).toBeGreaterThan(-1);
    expect(idxA10).toBeGreaterThan(-1);
    expect(idxB5).toBeGreaterThan(-1);
    expect(idxA2).toBeLessThan(idxA10);
    // barra vertical na mensagem deve ser escapada (\|)
    expect(conteudo).toContain('x \\| y');
  });

  it('persiste o mesmo objeto em json', async () => {
    const mod = await import('../../src/relatorios/gerador-relatorio.js');
    const resultado = { foo: 'bar', count: 1 };
    const out = path.join(process.cwd(), '.oraculo', 'tmp-gerador.json');
    await mod.gerarRelatorioJson(resultado as any, out);
    expect(salvarMock).toHaveBeenCalledWith(out, resultado);
  });
});
// fim do arquivo
