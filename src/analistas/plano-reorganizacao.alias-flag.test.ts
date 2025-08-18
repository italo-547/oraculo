// SPDX-License-Identifier: MIT
import { describe, it, expect } from 'vitest';
import { gerarPlanoReorganizacao } from './plano-reorganizacao.js';
import { config, aplicarConfigParcial } from '../nucleo/constelacao/cosmos.js';

// Testa sincronização entre SCAN_ONLY e ANALISE_SCAN_ONLY

describe('alias ANALISE_SCAN_ONLY', () => {
  it('respeita ANALISE_SCAN_ONLY ao gerar plano', () => {
    aplicarConfigParcial({ ANALISE_SCAN_ONLY: true });
    const plano = gerarPlanoReorganizacao([{ relPath: 'a.test.ts' }]);
    expect(plano.mover).toHaveLength(0);
    // reset
    aplicarConfigParcial({ ANALISE_SCAN_ONLY: false, SCAN_ONLY: false });
  });

  it('reflete SCAN_ONLY em ANALISE_SCAN_ONLY', () => {
    aplicarConfigParcial({ SCAN_ONLY: true });
    expect(config.ANALISE_SCAN_ONLY).toBe(true);
    aplicarConfigParcial({ SCAN_ONLY: false, ANALISE_SCAN_ONLY: false });
  });
});
