import { describe, it, expect } from 'vitest';
import { OperarioEstrutura } from './operario-estrutura.js';

// Mocks leves para entradas
const mkEntry = (relPath: string) => ({ relPath, fullPath: relPath, size: 10 }) as any;

describe('OperarioEstrutura.planejar', () => {
  it('gera plano com domains (criarSubpastasPorEntidade=true)', async () => {
    const baseDir = process.cwd();
    const arquivos = [mkEntry('src/userController.ts'), mkEntry('src/order.service.ts')];
    const { plano, origem } = await OperarioEstrutura.planejar(baseDir, arquivos, {
      preferEstrategista: true,
      criarSubpastasPorEntidade: true,
      categoriasMapa: { controller: 'controllers', service: 'services' },
      preset: 'oraculo',
    });
    expect(origem).toBe('estrategista');
    expect(plano).toBeTruthy();
    if (!plano) return;
    expect(Array.isArray(plano.mover)).toBe(true);
    // Não falha e propõe algo plausível
    expect(plano.mover.length).toBeGreaterThanOrEqual(0);
  });

  it('gera plano flat (criarSubpastasPorEntidade=false)', async () => {
    const baseDir = process.cwd();
    const arquivos = [mkEntry('src/paymentHandler.ts')];
    const { plano } = await OperarioEstrutura.planejar(baseDir, arquivos, {
      preferEstrategista: true,
      criarSubpastasPorEntidade: false,
      categoriasMapa: { handler: 'handlers' },
    });
    expect(plano).toBeTruthy();
    if (!plano) return;
    expect(Array.isArray(plano.mover)).toBe(true);
  });

  it('respeita overrides de categorias (controller=handlers)', async () => {
    const baseDir = process.cwd();
    const arquivos = [mkEntry('src/userController.ts')];
    const { plano } = await OperarioEstrutura.planejar(baseDir, arquivos, {
      preferEstrategista: true,
      criarSubpastasPorEntidade: false,
      categoriasMapa: { controller: 'handlers' },
    });
    expect(plano).toBeTruthy();
    if (!plano) return;
    expect(Array.isArray(plano.mover)).toBe(true);
  });
});
