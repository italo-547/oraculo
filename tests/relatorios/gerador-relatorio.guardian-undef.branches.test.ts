// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import { gerarRelatorioMarkdown } from '../../src/relatorios/gerador-relatorio.js';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('gerador-relatorio guardian undefined branches', () => {
  it('usa placeholders quando guardian é undefined', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'orac-rel-'));
    const alvo = path.join(tmp, 'rel.md');
    await gerarRelatorioMarkdown(
      {
        totalArquivos: 1,
        ocorrencias: [],
        guardian: undefined as any,
        timestamp: Date.now(),
        duracaoMs: 10,
        arquivosAnalisados: [],
        fileEntries: [],
      } as any,
      alvo,
    );
    const conteudo = await fs.readFile(alvo, 'utf-8');
    expect(conteudo).toMatch(/Status:\*\*?:?\s+não executada/);
    expect(conteudo).toMatch(/Timestamp:\*\*?:?\s+—/);
    expect(conteudo).toMatch(/Total de arquivos protegidos:\*\*?:?\s+—/);
  });
  it('usa placeholders quando guardian é objeto sem campos esperados', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'orac-rel-'));
    const alvo = path.join(tmp, 'rel2.md');
    await gerarRelatorioMarkdown(
      {
        totalArquivos: 1,
        ocorrencias: [],
        guardian: { foo: 1 } as any,
        timestamp: Date.now(),
        duracaoMs: 12,
        arquivosAnalisados: [],
        fileEntries: [],
      } as any,
      alvo,
    );
    const conteudo = await fs.readFile(alvo, 'utf-8');
    expect(conteudo).toMatch(/Status:\*\*?:?\s+não executada/);
    expect(conteudo).toMatch(/Timestamp:\*\*?:?\s+—/);
    expect(conteudo).toMatch(/Total de arquivos protegidos:\*\*?:?\s+—/);
  });
});
