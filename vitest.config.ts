import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "#test": fileURLToPath(new URL("./test", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    typecheck: {
      tsconfig: "./tsconfig.json",
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [...configDefaults.exclude, "src/cli/**"],
      reporter: ["text", "lcov", "json-summary"],
      reportsDirectory: "./test/.coverage",
      thresholds: {
        statements: 75,
        branches: 75,
        functions: 75,
        lines: 75,
      },
    },
    // No test file here mutates anything another one could see: there are no
    // module mocks, no global stubs and no environment writes, and every
    // fixture is a fresh temp directory. So a worker can keep one module graph
    // and reuse it across the files it runs, which is worth roughly half the
    // import time — the heavy imports here (shiki, sharp, resvg) are paid once
    // per worker rather than once per file.
    isolate: false,
    restoreMocks: true,
    testTimeout: 500,
  },
});
