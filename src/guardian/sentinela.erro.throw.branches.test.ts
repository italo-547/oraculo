// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';

vi.mock('./hash.js', () => ({ gerarSnapshotDoConteudo: (c: string) => 'h' + c }));
// baseline anterior com um arquivo
const baselineMock = { 'a.ts': 'hold' };
vi.mock('./baseline.js', () => ({
  carregarBaseline: vi.fn(async () => baselineMock),
  salvarBaseline: vi.fn(),
}));
vi.mock('./constantes.js', () => ({ BASELINE_PATH: '/tmp/bs.json' }));
// diff retorna diferença => erro
vi.mock('./diff.js', () => ({
  diffSnapshots: () => [{ tipo: 'DEL', arquivo: 'a.ts' }],
  verificarErros: (d: any) => ['DEL a.ts'],
}));
vi.mock('../nucleo/constelacao/log.js', () => ({
  log: { info: vi.fn(), aviso: vi.fn(), erro: vi.fn(), sucesso: vi.fn() },
}));
import { scanSystemIntegrity } from './sentinela.js';
import { GuardianError } from '../tipos/tipos.js';

describe('sentinela throw GuardianError branches', () => {
  it('lança GuardianError quando há erros e justDiff não setado', async () => {
    await expect(
      scanSystemIntegrity([{ relPath: 'b.ts', content: 'novo', fullPath: '/p/b.ts' }]),
    ).rejects.toBeInstanceOf(GuardianError);
  });
  it('retorna status AlteracoesDetectadas quando justDiff true (não lança)', async () => {
    const r = await scanSystemIntegrity(
      [{ relPath: 'b.ts', content: 'novo', fullPath: '/p/b.ts' }],
      { justDiff: true },
    );
    expect(r.status).not.toBeUndefined();
  });
});
