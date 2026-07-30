import path from "node:path";

import { isDirectory } from "./fs.js";

/**
 * Where a static site usually keeps its posts, in the order to prefer them.
 * The list is short on purpose: a directory that is not on it is one the run
 * can name itself, and guessing further would be guessing wrongly.
 */
const candidates = [
  "content",
  "src/content",
  "posts",
  "src/posts",
  "_posts",
  "src/pages",
];

/**
 * Guess which directory holds the content, or return `undefined` where none of
 * the usual ones is there.
 *
 * The guess only ever reaches the command line this prints for the project to
 * run next, so being wrong costs a corrected argument rather than a wrong build.
 */
export async function guessContentDir(
  dir: string,
): Promise<string | undefined> {
  const found = await Promise.all(
    candidates.map(async (candidate) =>
      (await isDirectory(path.join(dir, candidate))) ? candidate : undefined,
    ),
  );

  return found.find((candidate) => candidate !== undefined);
}
