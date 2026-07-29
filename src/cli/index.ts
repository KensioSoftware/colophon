#!/usr/bin/env node
import { generate } from "../generate/index.js";
import { parseCliArgs, usage } from "./args.js";
import { loadConfig } from "./config.js";

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
      // The URL is the half of a placement nothing else on the command line
      // would show, and the quickest way to see a `urlBase` is wrong.
      const served = result.url === undefined ? "" : ` -> ${result.url}`;
      console.log(
        `${result.skipped ? "skip " : "wrote"} ${result.outputPath}${served}`,
      );
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
