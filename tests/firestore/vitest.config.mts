import { defineConfig } from "vitest/config"

// Firestore rules tests: plain Vitest in Node, against the Firestore emulator started by `npm run test:rules`
export default defineConfig({
  test: {
    include: ["tests/firestore/**/*.spec.ts"],
    environment: "node",
    // The tests share one emulator: run the files one after another
    fileParallelism: false,
  },
})
