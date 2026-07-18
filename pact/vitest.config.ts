import { defineConfig } from 'vitest/config';

// Pact tests spin up mock/verifier servers and are slower than unit tests, so
// they run under their own config and npm script, not the main `vitest run`.
export default defineConfig({
  test: {
    include: ['pact/**/*.pact.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Mock servers bind ports; keep pact files serial to avoid cross-test races.
    fileParallelism: false,
  },
});
