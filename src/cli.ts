#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";

import { generate } from "./generate.js";
import type { ColophonConfig } from "./types.js";

interface CliArgs {
  readonly contentDir: string;
  readonly configPath: string | undefined;
  readonly overwrite: boolean;
}

const usage = `colophon — generate social meta images from frontmatter

Usage:
  colophon [contentDir] [options]

Options:
  -c, --config <path>   Load a config module (default export = ColophonConfig)
  -o, --overwrite       Re-render images even if the output file exists
  -h, --help            Show this help

Defaults:
  contentDir            content`;

function parseCliArgs(argv: readonly string[]): CliArgs {
  let contentDir = "content";
  let configPath: string | undefined;
  let shouldOverwrite = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "-c" || arg === "--config") {
      index += 1;
      const value = argv[index];
      if (value === undefined) {
        throw new Error(`Missing value for ${arg}`);
      }
      configPath = value;
    } else if (arg === "-o" || arg === "--overwrite") {
      shouldOverwrite = true;
    } else if (arg !== undefined && !arg.startsWith("-")) {
      contentDir = arg;
    }
  }

  return { contentDir, configPath, overwrite: shouldOverwrite };
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
