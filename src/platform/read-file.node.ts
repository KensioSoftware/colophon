import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Read a file named by a path.
 *
 * It is a module of its own so that a bundler can swap it: `package.json`'s
 * `browser` field points at the sibling that cannot, which is what keeps
 * `node:fs` out of the browser build's import graph. Everything that reads a
 * path goes through here, so there is one thing to swap rather than a check in
 * each caller.
 */
export async function readFileBytes(path: string): Promise<Uint8Array> {
  return new Uint8Array(await readFile(path));
}

/**
 * Make a configured path absolute and check something is there to read.
 *
 * Checked when the config is resolved rather than when the file is opened,
 * because a font or an image that cannot be read shows up as a blank corner on
 * every generated image, and a blank corner does not say which path was wrong.
 */
export function resolveReadablePath(
  given: string,
  label: string,
  kind: string,
): string {
  const absolute = path.resolve(given);

  if (!existsSync(absolute) || !statSync(absolute).isFile()) {
    throw new Error(
      `${label}: ${kind} not found at ${absolute} (from "${given}").` +
        ` Relative paths resolve from the working directory.`,
    );
  }

  return absolute;
}
