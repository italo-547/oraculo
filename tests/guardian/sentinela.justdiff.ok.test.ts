// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: { info: vi.fn(), erro: vi.fn(), sucesso: vi.fn(), aviso: vi.fn() },
}));
vi.mock('../../src/guardian/baseline.js', () => ({
  carregarBaseline: vi.fn(async () => ({ x: 'h' })),
  salvarBaseline: vi.fn(),
}));
vi.mock('../../src/guardian/hash.js', () => ({ gerarSnapshotDoConteudo: (c: string) => 'h' + c }));
vi.mock('../../src/guardian/diff.js', () => ({
  diffSnapshots: () => ({}) as any,
  verificarErros: () => [],
}));
vi.mock('../../src/guardian/constantes.js', () => ({ BASELINE_PATH: 'baseline.json' }));

describe('sentinela justDiff ok', () => {
  it('retorna status ok em modo justDiff sem alterações', async () => {
    const { scanSystemIntegrity } = await import('../../src/guardian/sentinela.js');
    const fileEntries = [{ relPath: 'a.ts', content: 'abc', fullPath: 'a.ts' }];
    const r = await scanSystemIntegrity(fileEntries, { justDiff: true });
    expect(r.status).toBe('ok');
    expect(r.detalhes).toEqual([]);
  });
});
