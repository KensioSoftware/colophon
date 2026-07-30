import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  assertIdentical,
  assertObjectMatches,
  assertStringIncludes,
  assertThrowsError,
  assertThrowsErrorAsync,
  assertUndefined,
} from "@kensio/smartass";
import { afterEach, beforeEach, describe, it } from "vitest";

import { parseCliArgs } from "./cli/args/index.js";
import { loadConfig } from "./cli/config.js";
import type { ColophonConfig } from "./types.js";

/** The one field these fixtures set, read off the loaded config. */
async function footerOf(file: string): Promise<string | undefined> {
  const config: ColophonConfig | undefined = await loadConfig(file);
  return config?.footer;
}

describe("parseCliArgs", () => {
  it("reads the config path off either spelling of the flag", () => {
    assertIdentical(parseCliArgs(["-c", "a.js"]).configPath, "a.js");
    assertIdentical(parseCliArgs(["--config", "b.js"]).configPath, "b.js");
  });

  it("reads a value joined to its flag with an equals sign", () => {
    assertIdentical(parseCliArgs(["--config=a.js"]).configPath, "a.js");
    assertIdentical(parseCliArgs(["--concurrency=3"]).concurrency, 3);
  });

  it("keeps an equals sign that belongs to the value", () => {
    assertIdentical(parseCliArgs(["--config=a=b.js"]).configPath, "a=b.js");
  });

  it("rejects a config flag with nothing after it", () => {
    const error = assertThrowsError(() => parseCliArgs(["--config"]));

    assertStringIncludes(error.message, "Missing value for --config");
  });

  it("builds a content tree when no command is named", () => {
    const args = parseCliArgs(["docs/content"]);

    assertIdentical(args.command, "generate");
    assertIdentical(args.contentDir, "docs/content");
    assertUndefined(args.file);
  });

  it("names no content directory of its own, so each command can default it", () => {
    assertUndefined(parseCliArgs([]).contentDir);
  });

  it("reads the switches off either spelling", () => {
    assertObjectMatches(parseCliArgs(["-n", "-w", "-f"]), {
      dryRun: true,
      watch: true,
      overwrite: true,
    });
    assertObjectMatches(parseCliArgs(["--dry-run", "--watch", "--overwrite"]), {
      dryRun: true,
      watch: true,
      overwrite: true,
    });
  });

  it("takes the argument after a command as its subject", () => {
    const args = parseCliArgs([
      "preview",
      "content/post/index.md",
      "--size",
      "og",
    ]);

    assertObjectMatches(args, {
      command: "preview",
      file: "content/post/index.md",
      size: "og",
    });
    assertUndefined(args.contentDir);
  });

  it("passes a content directory to init", () => {
    const args = parseCliArgs(["init", "src/content"]);

    assertIdentical(args.command, "init");
    assertIdentical(args.contentDir, "src/content");
  });

  // Ignoring it would have `--dry-runs` render and write the whole tree, which
  // is the one thing the run was asking it not to do.
  it("rejects an option it does not have, suggesting the one it looks like", () => {
    const error = assertThrowsError(() => parseCliArgs(["--dry-runs"]));

    assertStringIncludes(error.message, 'Unknown option "--dry-runs"');
    assertStringIncludes(error.message, 'Did you mean "--dry-run"?');
  });

  it("points at the help text when nothing is close enough to suggest", () => {
    const error = assertThrowsError(() => parseCliArgs(["--colour=blue"]));

    assertStringIncludes(error.message, "colophon --help");
  });

  it("rejects a second path rather than quietly building the last one", () => {
    const error = assertThrowsError(() => parseCliArgs(["content", "posts"]));

    assertStringIncludes(error.message, 'Unexpected argument "posts"');
  });

  it("rejects a concurrency that is not a positive integer", () => {
    const error = assertThrowsError(() =>
      parseCliArgs(["--concurrency", "half"]),
    );

    assertStringIncludes(error.message, "expected a positive integer");
  });
});

describe("loadConfig", () => {
  let dir: string;

  /** Write a config module and return its path, as `--config` would take it. */
  async function configModule(name: string, source: string): Promise<string> {
    const file = path.join(dir, name);
    await writeFile(file, source, "utf8");
    return file;
  }

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "colophon-cli-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("loads nothing when no config was asked for", async () => {
    assertUndefined(await loadConfig(undefined));
  });

  it("loads a config object", async () => {
    const file = await configModule(
      "object.mjs",
      `export default { footer: "example.com" };`,
    );

    assertIdentical(await footerOf(file), "example.com");
  });

  it("calls a function that returns a config", async () => {
    const file = await configModule(
      "function.mjs",
      `export default () => ({ footer: "computed.example.com" });`,
    );

    assertIdentical(await footerOf(file), "computed.example.com");
  });

  it("awaits an async function that returns a config", async () => {
    const file = await configModule(
      "async.mjs",
      `export default async () => {
         await Promise.resolve();
         return { footer: "async.example.com" };
       };`,
    );

    assertIdentical(await footerOf(file), "async.example.com");
  });

  it("resolves the path relative to the working directory", async () => {
    const file = await configModule(
      "relative.mjs",
      `export default { footer: "relative.example.com" };`,
    );

    const relative = path.relative(process.cwd(), file);

    assertIdentical(await footerOf(relative), "relative.example.com");
  });

  it("rejects a module with no default export", async () => {
    const file = await configModule(
      "named.mjs",
      `export const config = { footer: "example.com" };`,
    );
    const error = await assertThrowsErrorAsync(async () => loadConfig(file));

    assertStringIncludes(error.message, "The default export of");
    assertStringIncludes(error.message, "is not a config object");
  });

  it("rejects an array, which would otherwise pass as an empty config", async () => {
    const file = await configModule("array.mjs", `export default [];`);
    const error = await assertThrowsErrorAsync(async () => loadConfig(file));

    assertStringIncludes(error.message, "is not a config object");
  });

  it("rejects a function that returns nothing", async () => {
    const file = await configModule(
      "forgot-to-return.mjs",
      `export default () => { const config = { footer: "example.com" }; };`,
    );
    const error = await assertThrowsErrorAsync(async () => loadConfig(file));

    assertStringIncludes(error.message, "The function exported by");
  });
});
