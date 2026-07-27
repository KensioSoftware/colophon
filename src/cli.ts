#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";

import { generate } from "./generate.js";
import type { ColophonConfig } from "./types.js";

interface CliArgs {
  readonly contentDir: string;
  readonly configPath: string | undefined;
  readonly overwrite: boolean;
  readonly concurrency: number | undefined;
}

const usage = `colophon — generate social meta images from frontmatter

Usage:
  colophon [contentDir] [options]

Images carry a stamp of the props, config and size they came from, so a rebuild
renders only the ones that have actually changed.

Options:
  -c, --config <path>   Load a config module (default export = ColophonConfig)
  -f, --force           Re-render every image, ignoring the stamps
  -o, --overwrite       Alias for --force
  --concurrency <n>     How many images to render at once
  -h, --help            Show this help

Defaults:
  contentDir            content
  --concurrency         one per available CPU`;

/** `--overwrite` is kept as an alias so existing build scripts keep working. */
const forceFlags = new Set(["-f", "--force", "-o", "--overwrite"]);

/** Flags that take the next argument as their value. */
const valueFlags = new Set(["-c", "--config", "--concurrency"]);

/**
 * A mistyped count would otherwise reach `generate` as `NaN` and be reported
 * without naming the flag it came from, so it is rejected here instead.
 */
function parseConcurrency(value: string): number {
  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(
      `Invalid value for --concurrency: "${value}"; expected a positive integer.`,
    );
  }

  return parsed;
}

function parseCliArgs(argv: readonly string[]): CliArgs {
  let contentDir = "content";
  let configPath: string | undefined;
  let shouldOverwrite = false;
  let concurrency: number | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg !== undefined && valueFlags.has(arg)) {
      index += 1;
      const value = argv[index];
      if (value === undefined) {
        throw new Error(`Missing value for ${arg}`);
      }
      if (arg === "--concurrency") {
        concurrency = parseConcurrency(value);
      } else {
        configPath = value;
      }
    } else if (arg !== undefined && forceFlags.has(arg)) {
      shouldOverwrite = true;
    } else if (arg !== undefined && !arg.startsWith("-")) {
      contentDir = arg;
    }
  }

  return { contentDir, configPath, overwrite: shouldOverwrite, concurrency };
}

async function loadConfig(
  configPath: string | undefined,
): Promise<ColophonConfig | undefined> {
  if (configPath === undefined) {
    return undefined;
  }

  const url = pathToFileURL(path.resolve(configPath)).href;
  const module = (await import(url)) as { default?: ColophonConfig };
  return module.default;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.includes("-h") || argv.includes("--help")) {
    console.log(usage);
    return;
  }

  const args = parseCliArgs(argv);
  const config = await loadConfig(args.configPath);

  const results = await generate({
    contentDir: args.contentDir,
    overwrite: args.overwrite,
    ...(config !== undefined && { config }),
    ...(args.concurrency !== undefined && { concurrency: args.concurrency }),
    onResult: (result) => {
      console.log(`${result.skipped ? "skip " : "wrote"} ${result.outputPath}`);
    },
  });

  const written = results.filter((result) => !result.skipped).length;
  console.log(
    `Done: ${String(written)} written, ${String(results.length - written)} skipped.`,
  );
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
