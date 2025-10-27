import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/adventureworks',
  test: {
    environment: 'node',
    globals: true,
    setupFiles: './tests/setup.ts',
    coverage: { 
      provider: 'v8', 
      reporter: ['text', ['html', {
        subdir: 'coverage'
      }], 'lcov'] ,
    },
    include: [
      'tests/**/*.test.ts'
    ],
  }
});