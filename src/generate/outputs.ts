import path from "node:path";

import type { RenderJob } from "./job.js";

/**
 * Whether the filesystem underneath treats `Card.png` and `card.png` as one
 * file. Read off the platform rather than probed: a case-sensitive volume on
 * macOS would have two images it could have kept told to rename one of them,
 * which is a rare config and an obvious fix, where missing a real collision
 * leaves a build re-rendering for ever.
 */
const isCaseInsensitive =
  process.platform === "darwin" || process.platform === "win32";

/**
 * How a path is compared, which is not always how it is written: where case
 * does not distinguish two files, it must not distinguish two jobs either.
 */
function comparable(outputPath: string): string {
  const absolute = path.resolve(outputPath);
  return isCaseInsensitive ? absolute.toLowerCase() : absolute;
}

/**
 * Reject an extra image that would be written over another image in the same
 * build.
 *
 * Two jobs writing one path do not merely lose an image: each stamps the file
 * with its own digest, so every later build finds a stamp that does not match
 * and renders both again, for ever. A config naming the same path twice is a
 * copy-paste away, and an extra landing on a post's image is the kind of thing
 * a `route` slug strategy makes possible without anybody meaning it.
 *
 * Only extras are checked. Two posts resolving to one filename is older ground
 * — a shared frontmatter slug, and the same before extras existed — so failing
 * on it here would be a separate decision about content, not this one.
 *
 * Paths are compared resolved, since a content image names an absolute path
 * and an extra names whatever the config wrote.
 */
export function assertDistinctOutputs(
  content: readonly RenderJob[],
  extras: readonly RenderJob[],
): void {
  const taken = new Set(content.map((job) => comparable(job.outputPath)));

  for (const job of extras) {
    const key = comparable(job.outputPath);

    if (taken.has(key)) {
      throw new Error(
        `Two images would be written to "${job.outputPath}"; an extra image` +
          ` needs an output path of its own, or one of them is lost.`,
      );
    }

    taken.add(key);
  }
}
