// SPDX-License-Identifier: MIT
import { describe, it, expect, vi } from 'vitest';

// Cobrir caminho de amostra vazia e múltiplas linhas para snapshot (amostra limita a 200 chars já implicitamente)

vi.mock('./constantes.js', () => ({ ALGORITMO_HASH: 'sha256' }));

describe('hash (extra)', () => {
  it('geraSnapshotDoConteudo lida com linha inicial ausente (conteúdo iniciando com \n)', async () => {
    const { gerarSnapshotDoConteudo, gerarHashHex } = await import('./hash.js');
    const conteudo = '\nsegunda linha';
    const hash = gerarSnapshotDoConteudo(conteudo);
    expect(hash).toBe(gerarHashHex(conteudo));
  });
});
