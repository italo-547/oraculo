// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';

vi.mock('../nucleo/constelacao/log.js', () => ({
  log: { info: vi.fn(), erro: vi.fn(), sucesso: vi.fn(), aviso: vi.fn() },
}));
vi.mock('./baseline.js', () => ({
  carregarBaseline: vi.fn(async () => ({ x: 'h' })),
  salvarBaseline: vi.fn(),
}));
vi.mock('./hash.js', () => ({ gerarSnapshotDoConteudo: (c: string) => 'h' + c }));
vi.mock('./diff.js', () => ({ diffSnapshots: () => ({}) as any, verificarErros: () => [] }));
vi.mock('./constantes.js', () => ({ BASELINE_PATH: 'baseline.json' }));

describe('sentinela justDiff ok', () => {
  it('retorna status ok em modo justDiff sem alterações', async () => {
    const { scanSystemIntegrity } = await import('./sentinela.js');
    const fileEntries = [{ relPath: 'a.ts', content: 'abc', fullPath: 'a.ts' }];
    const r = await scanSystemIntegrity(fileEntries, { justDiff: true });
    expect(r.status).toBe('ok');
    expect(r.detalhes).toEqual([]);
  });
});
