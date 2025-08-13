import { describe, it, expect } from 'vitest';
import { gerarRelatorioMarkdown } from './gerador-relatorio.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';

// Cobre branches onde guardian é objeto parcial sem campos (status/timestamp/totalArquivos)

describe('gerador-relatorio guardian parcial branches', () => {
  it('usa fallbacks quando guardian objeto não possui chaves esperadas', async () => {
    const saida = path.join(process.cwd(), 'tmp-relatorio-guardian-parcial.md');
    const resultado: any = {
      totalArquivos: 0,
      ocorrencias: [],
      guardian: { qualquer: 'x' },
      timestamp: Date.now(),
      duracaoMs: 5,
    };
    await gerarRelatorioMarkdown(resultado, saida);
    const conteudo = await fs.readFile(saida, 'utf8');
    expect(conteudo).toMatch(/\*\*Status:\*\*\s+não executada/);
    expect(conteudo).toMatch(/\*\*Timestamp:\*\*\s+—/);
    expect(conteudo).toMatch(/\*\*Total de arquivos protegidos:\*\*\s+—/);
  });
});
