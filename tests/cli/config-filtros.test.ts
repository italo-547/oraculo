// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Configuração de Filtros', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('deve usar configuração do usuário quando disponível', async () => {
    // Mock do config com configuração do usuário
    vi.doMock('../../src/nucleo/constelacao/cosmos.js', () => ({
      config: {
        INCLUDE_EXCLUDE_RULES: {
          globalExcludeGlob: ['custom-exclude-1', 'custom-exclude-2'],
        },
      },
    }));

    const { getDefaultExcludes } = await import('../../src/cli/processamento-diagnostico.js');
    const excludes = getDefaultExcludes();

    expect(excludes).toContain('custom-exclude-1');
    expect(excludes).toContain('custom-exclude-2');
  });

  it('deve configurar filtros com precedência correta', async () => {
    const { config } = await import('../../src/nucleo/constelacao/cosmos.js');
    const { configurarFiltros } = await import('../../src/cli/processamento-diagnostico.js');

    // Testar precedência: flags > user config > cosmos defaults
    configurarFiltros([], [], ['flag-exclude'], false);

    expect(config.CLI_EXCLUDE_PATTERNS).toContain('flag-exclude');
  });

  it('deve remover node_modules quando explicitamente incluído', async () => {
    const { config } = await import('../../src/nucleo/constelacao/cosmos.js');
    const { configurarFiltros } = await import('../../src/cli/processamento-diagnostico.js');

    configurarFiltros([], ['node_modules'], [], true);

    expect(config.CLI_EXCLUDE_PATTERNS).not.toContain('node_modules');
    expect(config.CLI_EXCLUDE_PATTERNS).not.toContain('**/node_modules/**');
  });
});
