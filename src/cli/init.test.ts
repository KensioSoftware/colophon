import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  assertFileEquals,
  assertFileExists,
  assertFileIncludes,
  assertPathNotExists,
  assertStringIncludes,
  assertThrowsErrorAsync,
} from "@kensio/smartass";
import { afterEach, beforeEach, describe, it, vi } from "vitest";

import type { CliArgs } from "./args/index.js";
import { runInit } from "./init/index.js";

/** The command line `colophon init` runs with, plus whatever a case needs. */
function args(overrides: Partial<CliArgs> = {}): CliArgs {
  return {
    command: "init",
    contentDir: undefined,
    file: undefined,
    adapter: undefined,
    configPath: undefined,
    overwrite: false,
    dryRun: false,
    watch: false,
    concurrency: undefined,
    size: undefined,
    ...overrides,
  };
}

describe("runInit", () => {
  let dir: string;
  let logged: string[];

  beforeEach(async () => {
    logged = [];
    vi.spyOn(console, "log").mockImplementation((...parts: unknown[]) => {
      logged.push(parts.join(" "));
    });
    dir = await mkdtemp(path.join(tmpdir(), "colophon-init-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("writes a config module a project without one can import", async () => {
    await runInit(args(), dir);

    const config = path.join(dir, "colophon.config.mjs");
    // `.mjs` because nothing says the project is ESM, and a `.js` config would
    // then be CommonJS and fail the import `--config` does.
    assertFileExists(config);
    assertFileIncludes(config, "defineConfig");
  });

  it("writes a .js config where the project is already ESM", async () => {
    await writeFile(path.join(dir, "package.json"), `{ "type": "module" }`);

    await runInit(args(), dir);

    assertFileExists(path.join(dir, "colophon.config.js"));
    assertPathNotExists(path.join(dir, "colophon.config.mjs"));
  });

  it("points at the content directory it found", async () => {
    await mkdir(path.join(dir, "src", "content"), { recursive: true });

    await runInit(args(), dir);

    assertStringIncludes(logged.join("\n"), "colophon src/content --config");
  });

  it("asks for a content directory when it cannot find one", async () => {
    await runInit(args(), dir);

    assertStringIncludes(logged.join("\n"), "No content directory found");
  });

  it("prefers the content directory the run named", async () => {
    await mkdir(path.join(dir, "content"));

    await runInit(args({ contentDir: "essays" }), dir);

    assertStringIncludes(logged.join("\n"), "colophon essays --config");
  });

  it("refuses to replace a config that is already there", async () => {
    const mine = path.join(dir, "colophon.config.ts");
    await writeFile(mine, "// mine");

    const error = await assertThrowsErrorAsync(async () =>
      runInit(args(), dir),
    );

    assertStringIncludes(error.message, "Pass --force");
    assertFileEquals(mine, "// mine");
  });

  it("replaces the config it found at that config's own path", async () => {
    const mine = path.join(dir, "colophon.config.ts");
    await writeFile(mine, "// mine");

    await runInit(args({ overwrite: true }), dir);

    assertFileIncludes(mine, "defineConfig");
    // A project that settled on a TypeScript config does not end up with two.
    assertPathNotExists(path.join(dir, "colophon.config.mjs"));
  });
});
