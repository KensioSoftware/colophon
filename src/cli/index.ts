#!/usr/bin/env node
import type { CliArgs } from "./args/index.js";
import { parseCliArgs, usage } from "./args/index.js";
import { runBuild } from "./build.js";
import { runEject } from "./eject/index.js";
import { runInit } from "./init/index.js";
import { messageOf } from "./message.js";
import { runPlayground } from "./playground/index.js";
import { runPreview } from "./preview/index.js";

/** Run whichever command the arguments asked for. */
async function run(args: CliArgs): Promise<void> {
  switch (args.command) {
    case "init": {
      return runInit(args);
    }
    case "preview": {
      return runPreview(args);
    }
    case "playground": {
      return runPlayground(args);
    }
    case "eject": {
      return runEject(args);
    }
    case "generate": {
      return runBuild(args);
    }
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.includes("-h") || argv.includes("--help")) {
    console.log(usage);
    return;
  }

  await run(parseCliArgs(argv));
}

try {
  await main();
} catch (error) {
  console.error(messageOf(error));
  process.exitCode = 1;
}
