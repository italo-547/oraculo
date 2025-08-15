import { describe, it, expect } from 'vitest';
import { aplicarConfigParcial, config } from '../nucleo/constelacao/cosmos.js';
import { detectorEstrutura } from './detector-estrutura.js';

// cobre ramo: muitos arquivos na raiz com limite vindo do config (assumindo default 10)
describe('detector-estrutura (cobertura extra)', () => {
  it('marca estrutura-suspeita quando excede limite configurado', () => {
    const prev = (config as any).ESTRUTURA_ARQUIVOS_RAIZ_MAX;
    try {
      // força limite baixo para garantir detecção mesmo com override de repo
      aplicarConfigParcial({ ESTRUTURA_ARQUIVOS_RAIZ_MAX: 10 });
      const arquivos = Array.from({ length: 12 }, (_, i) => ({ relPath: `file${i}.js` }));
      const ocorr = detectorEstrutura.aplicar('', '', undefined, '', { arquivos } as any);
      expect(Array.isArray(ocorr) && ocorr.some((o: any) => o.tipo === 'estrutura-suspeita')).toBe(
        true,
      );
    } finally {
      aplicarConfigParcial({ ESTRUTURA_ARQUIVOS_RAIZ_MAX: prev });
    }
  });
});
