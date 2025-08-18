// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanSystemIntegrity } from './sentinela.js';
import { config } from '../nucleo/constelacao/cosmos.js';

vi.mock('../nucleo/constelacao/log.js', () => ({
  log: { info: vi.fn(), erro: vi.fn(), sucesso: vi.fn(), aviso: vi.fn() },
}));
import { log } from '../nucleo/constelacao/log.js';

vi.mock('./baseline.js', () => ({
  carregarBaseline: vi.fn(async () => ({})),
  salvarBaseline: vi.fn(),
}));
vi.mock('./hash.js', () => ({ gerarSnapshotDoConteudo: (c: string) => 'h' + c }));
vi.mock('./diff.js', () => ({ diffSnapshots: () => ({}) as any, verificarErros: () => [] }));
vi.mock('./constantes.js', () => ({ BASELINE_PATH: 'baseline.json' }));

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
