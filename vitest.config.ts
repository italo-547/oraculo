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
      // Habilita cobertura apenas quando explicitamente solicitado (ex.: COVERAGE=true ou via CLI)
      enabled: process.env.COVERAGE === 'true',
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 88,
        statements: 90,
      },
    },
  },
});
