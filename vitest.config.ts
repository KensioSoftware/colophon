import { availableParallelism } from "node:os";
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
      // `text` is for whoever is watching, and `json-summary` is what the
      // coverage badge workflow reads. There was an `lcov` here too, which
      // nothing consumed: it is a tree of files written on every run for a
      // reader that does not exist, and dropping it is worth about 400ms.
      reporter: ["text", "json-summary"],
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
    // The suite is bound by its longest file rather than by how many workers
    // there are: `generate.test.ts` is the best part of six seconds of real
    // rendering on its own, and nothing finishes before it does. Past about
    // four workers there is no test left to hand a fifth, so another one only
    // adds a module graph to build and a share of the CPU to compete for.
    // Measured on an eighteen-core machine under coverage, where the default
    // (one worker per core, less one) ran between eight and thirteen seconds
    // against a steady six and a half here. It changes nothing on the CI
    // runners, which have four cores and so were already at this number.
    maxWorkers: Math.min(availableParallelism(), 4),
    restoreMocks: true,
    testTimeout: 500,
  },
});
