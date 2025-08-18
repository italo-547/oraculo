// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';

vi.mock('./hash.js', () => ({
  gerarSnapshotDoConteudo: () => {
    throw new Error('boom');
  },
}));
vi.mock('./baseline.js', () => ({
  carregarBaseline: vi.fn(async () => null),
  salvarBaseline: vi.fn(),
}));
vi.mock('./diff.js', () => ({ diffSnapshots: () => [], verificarErros: () => [] }));
vi.mock('./constantes.js', () => ({ BASELINE_PATH: '/tmp/bs.json' }));
vi.mock('../nucleo/constelacao/log.js', () => ({
  log: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn() },
}));

import { scanSystemIntegrity } from './sentinela.js';
import { log } from '../nucleo/constelacao/log.js';

describe('sentinela hash fail branch', () => {
  it('loga aviso quando gerarSnapshotDoConteudo lança erro', async () => {
    await scanSystemIntegrity([{ relPath: 'a.ts', content: 'code', fullPath: '/p/a.ts' }]);
    const avisos = (log.aviso as any).mock.calls.map((c: any) => c[0]).join('\n');
    expect(avisos).toMatch(/Falha ao gerar hash/);
  });
});
