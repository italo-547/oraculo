// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks básicos
vi.mock('../nucleo/constelacao/log.js', () => ({
  log: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn() },
}));
vi.mock('./baseline.js', () => ({
  carregarBaseline: vi.fn(async () => null),
  salvarBaseline: vi.fn(async () => undefined),
}));
vi.mock('./hash.js', () => ({ gerarSnapshotDoConteudo: (c: string) => 'h' + c }));
vi.mock('./diff.js', () => ({ diffSnapshots: () => [], verificarErros: () => [] }));
vi.mock('./constantes.js', () => ({ BASELINE_PATH: '/tmp/bs.json' }));

describe('sentinela DEV_MODE filtro log branch', () => {
  beforeEach(async () => {
    // Garante DEV_MODE ligado (ESM dynamic import)
    const mod = await import('../nucleo/constelacao/cosmos.js');
    mod.config.DEV_MODE = true as any;
  });

  it('loga info com resumo de filtro quando DEV_MODE true e há removidos', async () => {
    const { scanSystemIntegrity } = await import('./sentinela.js');
    const { log } = await import('../nucleo/constelacao/log.js');
    await scanSystemIntegrity([
      { relPath: 'src/a.ts', content: 'code', fullPath: '/p/src/a.ts' },
      {
        relPath: 'node_modules/pkg/index.js',
        content: 'x',
        fullPath: '/p/node_modules/pkg/index.js',
      },
    ] as any);
    const infos = (log.info as any).mock.calls.map((c: any) => c[0]).join('\n');
    expect(infos).toMatch(/Guardian filtro aplicado/);
  });
});
