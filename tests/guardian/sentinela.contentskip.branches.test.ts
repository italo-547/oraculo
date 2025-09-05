// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn() },
}));
vi.mock('../../src/guardian/baseline.js', () => ({
  carregarBaseline: vi.fn(async () => null),
  salvarBaseline: vi.fn(),
}));
vi.mock('../../src/guardian/hash.js', () => ({ gerarSnapshotDoConteudo: (c: string) => 'h' + c }));
vi.mock('../../src/guardian/diff.js', () => ({
  diffSnapshots: () => [],
  verificarErros: () => [],
}));
vi.mock('../../src/guardian/constantes.js', () => ({ BASELINE_PATH: '/tmp/bs.json' }));

describe('sentinela content skip branch', () => {
  it('ignora entry com content vazio ou whitespace', async () => {
    const { scanSystemIntegrity } = await import('../../src/guardian/sentinela.js');
    const { salvarBaseline } = await import('../../src/guardian/baseline.js');
    await scanSystemIntegrity([
      { relPath: 'keep.ts', content: 'code', fullPath: '/p/keep.ts' },
      { relPath: 'skip1.ts', content: '', fullPath: '/p/skip1.ts' },
      { relPath: 'skip2.ts', content: '   ', fullPath: '/p/skip2.ts' },
    ]);
    const snapshot = (salvarBaseline as any).mock.calls[0][0];
    expect(snapshot).toHaveProperty('keep.ts');
    expect(snapshot).not.toHaveProperty('skip1.ts');
    expect(snapshot).not.toHaveProperty('skip2.ts');
  });
});
