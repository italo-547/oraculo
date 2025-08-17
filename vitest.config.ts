import { defineConfig } from 'vitest/config';

// Config dedicada para garantir limpeza de arquivos 0% já removidos e controlar 'all'
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['.deprecados/**', '.abandonados/**', 'tests/fixtures/estruturas/**/node_modules/**'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      // Sempre habilitado quando --coverage é passado; também pode ser ativado via env COVERAGE=true
      enabled: process.env.COVERAGE === 'true',
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
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 88,
        statements: 90,
      },
    },
  },
});
