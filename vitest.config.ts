import { defineConfig } from 'vitest/config';

// Config dedicada para garantir limpeza de arquivos 0% já removidos e controlar 'all'
export default defineConfig(({ mode }) => {
  // Gate de cobertura só em CI ou quando explicitamente solicitado via env
  const isCI = process.env.CI === 'true';
  const coverageEnabled = isCI || process.env.COVERAGE === 'true';
  const enforceThresholds =
    isCI || process.env.COVERAGE_ENFORCE === 'true' || process.env.COVERAGE === 'true';

  return {
    test: {
      globals: true,
      environment: 'node',
      include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts'],
      exclude: [
        '.deprecados/**',
        '.abandonados/**',
        'tests/fixtures/estruturas/**/node_modules/**',
      ],
      coverage: {
        provider: 'v8',
        reportsDirectory: './coverage',
        // Habilita coleta em CI ou quando COVERAGE=true; o flag --coverage também ativa
        enabled: coverageEnabled,
        // Considera cobertura apenas do código-fonte
        include: ['src/**/*.ts'],
        // Exclui artefatos compilados, scripts e conteúdos auxiliares/fixtures
        exclude: [
          'dist/**',
          'pre-public/**',
          'scripts/**',
          'tests/**',
          'temp-fantasma/**',
          'tmp-**/**',
          '**/fixtures/**',
          '**/mocks/**',
          '**/__tests__/**',
          'file1.ts',
          'file2.ts',
          'tmp-cache-file.ts',
        ],
        all: false,
        // Só aplica thresholds quando em CI ou explicitamente solicitado
        ...(enforceThresholds
          ? {
              thresholds: {
                lines: 90,
                functions: 90,
                branches: 88,
                statements: 90,
              },
            }
          : {}),
      },
    },
  };
});
