// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanSystemIntegrity } from '../../src/guardian/sentinela.js';
import { config } from '../../src/nucleo/constelacao/cosmos.js';

vi.mock('../../src/nucleo/constelacao/log.js', () => ({
  log: { info: vi.fn(), erro: vi.fn(), sucesso: vi.fn(), aviso: vi.fn() },
}));
import { log } from '../../src/nucleo/constelacao/log.js';

vi.mock('../../src/guardian/baseline.js', () => ({
  carregarBaseline: vi.fn(async () => ({})),
  salvarBaseline: vi.fn(),
}));
vi.mock('../../src/guardian/hash.js', () => ({ gerarSnapshotDoConteudo: (c: string) => 'h' + c }));
vi.mock('../../src/guardian/diff.js', () => ({
  diffSnapshots: () => ({}) as any,
  verificarErros: () => [],
}));
vi.mock('../../src/guardian/constantes.js', () => ({ BASELINE_PATH: 'baseline.json' }));

describe('sentinela DEV_MODE filtro', () => {
  beforeEach(() => {
    Object.assign(config, { DEV_MODE: true, GUARDIAN_IGNORE_PATTERNS: ['ignore/**'] });
  });
  it('loga resumo de filtro aplicado em DEV_MODE', async () => {
    const fileEntries = [
      { relPath: 'keep/a.ts', content: 'a', fullPath: 'keep/a.ts' },
      { relPath: 'ignore/x.ts', content: 'b', fullPath: 'ignore/x.ts' },
    ];
    await scanSystemIntegrity(fileEntries);
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('Guardian filtro aplicado'));
  });
});
