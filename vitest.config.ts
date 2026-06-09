import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Pure game-logic tests only (no DOM/WebGL); kept out of src so `tsc` skips them.
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
