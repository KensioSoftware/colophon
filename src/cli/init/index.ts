import { writeFile } from "node:fs/promises";
import path from "node:path";

import type { CliArgs } from "../args/index.js";
import { guessContentDir } from "./guess.js";
import { configFilename, existingConfig } from "./module.js";
import { scaffold } from "./scaffold.js";

/** The command to run next, which is the whole point of the guess. */
function nextStep(config: string, contentDir: string | undefined): string {
  if (contentDir === undefined) {
    return (
      `No content directory found. Point the CLI at yours:\n` +
      `  colophon <contentDir> --config ${config}`
    );
  }

  return `Then render the images:\n  colophon ${contentDir} --config ${config}`;
}

/**
 * Write a starter config module into `dir`, the working directory by default,
 * and say what to run against it.
 *
 * A config that is already there is replaced only under `--force`, and then at
 * its own path rather than at the one this would have chosen: a project that
 * settled on a TypeScript config should not end up holding two.
 */
export async function runInit(
  args: CliArgs,
  dir = process.cwd(),
): Promise<void> {
  const [existing, chosen, guessed] = await Promise.all([
    existingConfig(dir),
    configFilename(dir),
    guessContentDir(dir),
  ]);

  if (existing !== undefined && !args.overwrite) {
    throw new Error(
      `${existing} is already there. Pass --force to replace it.`,
    );
  }

  const config = existing ?? chosen;
  await writeFile(path.join(dir, config), scaffold, "utf8");

  console.log(`Wrote ${config}.`);
  console.log(nextStep(config, args.contentDir ?? guessed));
}
