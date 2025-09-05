// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import { gerarRelatorioMarkdown } from '../../src/relatorios/gerador-relatorio.js';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('gerador-relatorio guardian populado branches', () => {
  it('inclui campos reais de guardian quando presentes', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'orac-rel-pop-'));
    const alvo = path.join(tmp, 'rel.md');
    const guardian = {
      status: 'ok',
      timestamp: '2024-01-01T00:00:00.000Z',
      totalArquivos: 42,
    } as any;
    await gerarRelatorioMarkdown(
      {
        totalArquivos: 2,
        ocorrencias: [],
        guardian,
        timestamp: new Date().toISOString(),
        duracaoMs: 5,
      } as any,
      alvo,
    );
    const conteudo = await fs.readFile(alvo, 'utf-8');
    expect(conteudo).toMatch(/Status:\*\*?:?\s+ok/);
    expect(conteudo).toMatch(/Timestamp:\*\*?:?\s+2024-01-01T00:00:00.000Z/);
    expect(conteudo).toMatch(/Total de arquivos protegidos:\*\*?:?\s+42/);
  });
});
