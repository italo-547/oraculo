import { describe, it, expect } from 'vitest';
import { gerarRelatorioMarkdown } from './gerador-relatorio.js';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Cobre branches faltantes em gerador-relatorio.ts:
//  - Guardian objeto vazio (fallbacks: status/"não executada", timestamp/"—", total/"—")
//  - Comparator de ordenação usando segundo critério (linha) quando relPath igual
//  - Escape de pipe "|" dentro da mensagem
//  - Tabela construída com múltiplas ocorrências ordenadas

describe('gerarRelatorioMarkdown guardian vazio e ordenação secundária', () => {
  it('usa fallbacks quando guardian é objeto vazio e ordena por linha quando relPath igual', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'oraculo-gr-'));
    const arquivo = path.join(tmp, 'relatorio.md');

    const ocorrencias = [
      { tipo: 'X', mensagem: 'Msg com pipe | no meio', relPath: 'src/a.ts', linha: 10 },
      { tipo: 'X', mensagem: 'Outra', relPath: 'src/a.ts', linha: 2 }, // deve vir antes pelo número da linha
    ];

    await gerarRelatorioMarkdown(
      {
        totalArquivos: 1,
        ocorrencias: ocorrencias as any,
        arquivosAnalisados: ['src/a.ts'],
        timestamp: Date.now(),
        duracaoMs: 5,
        guardian: {}, // objeto sem campos esperados -> fallbacks
        fileEntries: [] as any,
      },
      arquivo,
    );

    const conteudo = await fs.readFile(arquivo, 'utf-8');
    // Fallbacks
    // Pode haver espaços/indentação antes de - **Status:**
    expect(conteudo).toMatch(/\*\*Status:\*\*\s+não executada/);
    expect(conteudo).toMatch(/\*\*Timestamp:\*\*\s+—/);
    expect(conteudo).toMatch(/\*\*Total de arquivos protegidos:\*\*\s+—/);

    // Ordem por linha (2 antes de 10) e escape de pipe (\\|)
    const tabelaIdx = conteudo.indexOf('| Arquivo |');
    expect(tabelaIdx).toBeGreaterThan(-1);
    const linhasTabela = conteudo
      .slice(tabelaIdx)
      .split(/\n/)
      .filter((l) => l.startsWith('| src/a.ts'));
    expect(linhasTabela.length).toBe(2);
    // Primeira linha deve conter linha 2
    expect(linhasTabela[0]).toMatch(/\| src\/a.ts \| 2 \|/);
    expect(linhasTabela[1]).toMatch(/\| src\/a.ts \| 10 \|/);
    // Escape de pipe na mensagem
    expect(linhasTabela.some((l) => /Msg com pipe \\\| no meio/.test(l))).toBe(true);
  });
});
