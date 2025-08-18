// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocka helpers centralizados de persistência (conforme diretrizes)
vi.mock('../zeladores/util/persistencia.js', () => {
  return {
    salvarEstado: vi.fn().mockResolvedValue(undefined),
    lerEstado: vi.fn(),
  };
});

import {
  gerarRelatorioReestruturarMarkdown,
  gerarRelatorioReestruturarJson,
} from './relatorio-reestruturar.js';
import { salvarEstado } from '../zeladores/util/persistencia.js';

describe('relatorio-reestruturar — geração de relatórios (branches)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Markdown — sem movimentos usa defaults e imprime mensagem de vazio', async () => {
    const caminho = 'out.md';
    await gerarRelatorioReestruturarMarkdown(caminho, []);

    expect(salvarEstado).toHaveBeenCalledTimes(1);
    const [destino, conteudo] = (salvarEstado as unknown as vi.Mock).mock.calls[0];
    expect(destino).toBe(caminho);
    expect(typeof conteudo).toBe('string');
    const md = String(conteudo);
    // Cabeçalho e metadados básicos
    expect(md).toContain('# 🧩 Relatório de Reestruturação Oracular');
    expect(md).toContain('**Execução:** Real'); // default simulado=false
    expect(md).toContain('**Origem do plano:** desconhecido');
    expect(md).toContain('**Preset:** oraculo');
    expect(md).toContain('**Total de movimentos:** 0');
    expect(md).toContain('**Conflitos detectados:** 0');
    // Bloco de movimentos vazio
    expect(md).toContain('## Movimentos');
    expect(md).toContain('Nenhum movimento sugerido neste ciclo.');
  });

  it('Markdown — com movimentos e opções custom imprime tabela e campos', async () => {
    const movimentos = [
      { de: 'src/a.ts', para: 'ideal/a.ts' },
      { de: 'src/b.ts', para: 'ideal/b.ts' },
    ];
    const caminho = 'plan.md';
    await gerarRelatorioReestruturarMarkdown(caminho, movimentos, {
      simulado: true,
      origem: 'cli',
      preset: 'custom',
      conflitos: 3,
    });

    expect(salvarEstado).toHaveBeenCalledTimes(1);
    const [, conteudo] = (salvarEstado as unknown as vi.Mock).mock.calls[0];
    const md = String(conteudo);
    expect(md).toContain('**Execução:** Simulação');
    expect(md).toContain('**Origem do plano:** cli');
    expect(md).toContain('**Preset:** custom');
    expect(md).toContain('**Total de movimentos:** 2');
    expect(md).toContain('**Conflitos detectados:** 3');
    // Tabela com cabeçalho e linhas
    expect(md).toContain('| De | Para |');
    expect(md).toContain('|----|------|');
    expect(md).toContain('| src/a.ts | ideal/a.ts |');
    expect(md).toContain('| src/b.ts | ideal/b.ts |');
  });

  it('JSON — sem opções usa defaults coerentes', async () => {
    const caminho = 'out.json';
    await gerarRelatorioReestruturarJson(caminho, []);
    expect(salvarEstado).toHaveBeenCalledTimes(1);
    const [destino, json] = (salvarEstado as unknown as vi.Mock).mock.calls[0];
    expect(destino).toBe(caminho);
    expect(typeof json).toBe('object');
    expect(json).toMatchObject({
      simulado: false,
      origem: 'desconhecido',
      preset: 'oraculo',
      conflitos: 0,
      totalMovimentos: 0,
      movimentos: [],
    });
    expect(typeof json.timestamp).toBe('number');
  });

  it('JSON — com opções custom preenche campos corretamente', async () => {
    const caminho = 'plan.json';
    const movimentos = [{ de: 'x', para: 'y' }];
    await gerarRelatorioReestruturarJson(caminho, movimentos, {
      simulado: true,
      origem: 'cli',
      preset: 'custom',
      conflitos: 7,
    });
    const [, json] = (salvarEstado as unknown as vi.Mock).mock.calls[0];
    expect(json).toMatchObject({
      simulado: true,
      origem: 'cli',
      preset: 'custom',
      conflitos: 7,
      totalMovimentos: 1,
      movimentos,
    });
  });
});
