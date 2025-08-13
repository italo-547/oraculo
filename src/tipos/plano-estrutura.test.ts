import { describe, it, expect } from 'vitest';
import type { PlanoSugestaoEstrutura } from './plano-estrutura.js';

describe('plano-estrutura tipos', () => {
  it('permite criar objeto válido', () => {
    const plano: PlanoSugestaoEstrutura = {
      mover: [{ de: 'src/a.ts', para: 'app/a.ts' }],
      conflitos: [{ alvo: 'src/a.ts', motivo: 'já existe destino' }],
      resumo: { total: 1, zonaVerde: 0, bloqueados: 0 },
    };
    expect(plano.mover[0].de).toBe('src/a.ts');
  });
});
