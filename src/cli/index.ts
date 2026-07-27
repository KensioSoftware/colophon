#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";

import { generate } from "../generate/index.js";
import type { ColophonConfig } from "../types.js";
import { parseCliArgs, usage } from "./args.js";

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
