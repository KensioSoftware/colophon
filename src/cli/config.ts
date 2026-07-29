import path from "node:path";
import { pathToFileURL } from "node:url";

import type { ColophonConfig, ColophonConfigInput } from "../types.js";

/**
 * A module that exports nothing usable is a mistake rather than a config that
 * happens to be empty: the run named the file on the command line, so falling
 * back to the defaults would render a whole tree with none of what it asked
 * for and say nothing about it.
 */
function assertConfig(
  value: unknown,
  source: string,
): asserts value is ColophonConfig {
  if (typeof value !== "object" || value === null) {
    throw new Error(
      `${source} is not a config object.` +
        ` Export a ColophonConfig, or a function returning one.`,
    );
  }
}

/**
 * Load the config module named by `--config`.
 *
 * The default export may be the config itself or a function returning one,
 * possibly async. A config that has to compute something cannot be written as
 * a literal, and without the function form such a project has to abandon the
 * CLI and call `generate` from a script of its own — reimplementing the
 * reporting the CLI already does along the way.
 */
export async function loadConfig(
  configPath: string | undefined,
): Promise<ColophonConfig | undefined> {
  if (configPath === undefined) {
    return undefined;
  }

  const url = pathToFileURL(path.resolve(configPath)).href;
  const module = (await import(url)) as { default?: ColophonConfigInput };
  const exported = module.default;

  if (typeof exported === "function") {
    const config = await exported();
    assertConfig(config, `The function exported by ${configPath}`);
    return config;
  }

  assertConfig(exported, `The default export of ${configPath}`);
  return exported;
}
