// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';
import { iniciarInquisicao } from './inquisidor.js';
import { scanRepository } from './scanner.js';

vi.mock('./scanner.js', () => ({
  scanRepository: vi.fn(async () => ({
    'quebra.js': {
      fullPath: 'quebra.js',
      relPath: 'quebra.js',
      content: 'function x( {',
      origem: 'local',
    },
  })),
}));

// Mock parser para lançar erro
vi.mock('./parser.js', () => ({
  decifrarSintaxe: vi.fn(async () => {
    throw new Error('syntax error');
  }),
}));

vi.mock('./constelacao/log.js', () => ({
  log: { info: vi.fn(), erro: vi.fn(), sucesso: vi.fn(), aviso: vi.fn(), debug: vi.fn() },
}));

describe('parse erro ocorrência', () => {
  it('gera ocorrência PARSE_ERRO quando parser falha', async () => {
    const res = await iniciarInquisicao(process.cwd(), { includeContent: true });
    expect(res.ocorrencias.some((o) => o.tipo === 'PARSE_ERRO')).toBe(true);
  });
});
