import { describe, it, expect } from 'vitest';
import { gerarPlanoReorganizacao } from './plano-reorganizacao.js';
import { config } from '../nucleo/constelacao/cosmos.js';

describe('gerarPlanoReorganizacao', () => {
  it('gera moves básicos para arquivos na raiz', () => {
    const plano = gerarPlanoReorganizacao([
      { relPath: 'a.test.ts' },
      { relPath: 'script-build.ts' },
      { relPath: 'custom.config.js' },
      { relPath: 'types.d.ts' },
      { relPath: 'README-fragment-intro.md' },
    ]);
    const alvos = plano.mover.map((m) => m.para).sort();
    expect(alvos).toEqual(
      [
        `${config.ESTRUTURA_TARGETS.CONFIG_DIR}/custom.config.js`,
        `${config.ESTRUTURA_TARGETS.DOCS_FRAGMENTS_DIR}/README-fragment-intro.md`,
        `${config.ESTRUTURA_TARGETS.TESTS_RAIZ_DIR}/a.test.ts`,
        `${config.ESTRUTURA_TARGETS.SCRIPTS_DIR}/build.ts`,
        `${config.ESTRUTURA_TARGETS.TYPES_DIR}/types.d.ts`,
      ].sort(),
    );
  });
  it('não gera moves em SCAN_ONLY', () => {
    config.SCAN_ONLY = true;
    const plano = gerarPlanoReorganizacao([{ relPath: 'a.test.ts' }]);
    expect(plano.mover).toHaveLength(0);
    config.SCAN_ONLY = false;
  });
  it('ignora arquivos grandes acima do limite', () => {
    config.ESTRUTURA_PLANO_MAX_FILE_SIZE = 10; // 10 bytes
    const plano = gerarPlanoReorganizacao([{ relPath: 'a.test.ts', size: 11 }]);
    expect(plano.mover).toHaveLength(0);
    config.ESTRUTURA_PLANO_MAX_FILE_SIZE = 256 * 1024; // reset
  });
  it('registra conflito quando destino já existe', () => {
    const plano = gerarPlanoReorganizacao([{ relPath: 'a.test.ts' }, { relPath: 'src/a.test.ts' }]);
    expect(plano.conflitos?.some((c) => c.alvo === 'src/a.test.ts')).toBe(true);
  });
});
