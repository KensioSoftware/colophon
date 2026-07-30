import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { nearestName } from "../../validate/suggest.js";
import type { CliArgs } from "../args/index.js";
import { isFile } from "../init/fs.js";
import type { Adapter } from "./adapters.js";
import { adapterNames, adapters } from "./adapters.js";

/** The adapter a run named, or a complaint naming the ones there are. */
function selectAdapter(name: string | undefined): Adapter {
  if (name === undefined) {
    throw new Error(
      `colophon eject needs something to eject: ${adapterNames.join(", ")}.`,
    );
  }

  const adapter = adapters[name];

  if (adapter !== undefined) {
    return adapter;
  }

  // The same slip, and the same answer, as a mistyped config option.
  const suggestion = nearestName(name, adapterNames);
  const help =
    suggestion === undefined
      ? `Try one of: ${adapterNames.join(", ")}.`
      : `Did you mean "${suggestion}"?`;

  throw new Error(`Cannot eject "${name}". ${help}`);
}

/**
 * Write a generator's template into the site, and say how to use it.
 *
 * Ejecting rather than importing is the point. The file lands in the site's own
 * tree, where a project can read it, change the fallback chain and add a tag,
 * without Colophon having to grow an option for every decision a site makes
 * about its own head. What it replaces is 50-odd lines of globbing for images
 * that the build already knew the names of.
 *
 * `dir` is the site root, the working directory by default, and a parameter
 * because a test cannot `chdir`.
 */
export async function runEject(
  args: CliArgs,
  dir = process.cwd(),
): Promise<void> {
  const adapter = selectAdapter(args.adapter);
  const target = path.join(dir, adapter.file);

  if ((await isFile(target)) && !args.overwrite) {
    throw new Error(
      `${adapter.file} is already there. Pass --force to replace it,` +
        ` remembering that it is a file you were meant to edit.`,
    );
  }

  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, adapter.contents, "utf8");

  console.log(`Wrote ${adapter.file}.`);
  console.log(adapter.usage);
}
