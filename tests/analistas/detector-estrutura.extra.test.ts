// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import { detectorEstrutura } from '../../src/analistas/detector-estrutura.js';

describe('detectorEstrutura (extra)', () => {
  it('detecta projeto grande sem src/', () => {
    const arquivos = Array.from({ length: 35 }).map((_, i) => ({
      relPath: `file${i}.js`,
      ast: null,
    }));
    const contexto = { arquivos } as any;
    const ocorrencias = detectorEstrutura.aplicar('', '', undefined, '', contexto) as any[];
    expect(ocorrencias.some((o) => o.tipo === 'estrutura-sem-src')).toBe(true);
  });
});
