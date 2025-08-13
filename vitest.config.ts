import { defineConfig } from 'vitest/config';

// Config dedicada para garantir limpeza de arquivos 0% já removidos e controlar 'all'
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      all: false, // evita listar arquivos não importados nem existentes
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        'tests/**',
        '**/fixtures/**',
        '**/mocks/**',
        '**/__tests__/**',
        'temp-fantasma/**',
        'scripts/**',
      ],
      thresholds: { lines: 90, statements: 90, branches: 88, functions: 90 },
    },
  },
});
