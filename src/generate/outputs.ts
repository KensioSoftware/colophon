import path from "node:path";

import type { RenderJob } from "./job.js";

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
  const taken = new Set(content.map((job) => path.resolve(job.outputPath)));

  for (const job of extras) {
    const absolute = path.resolve(job.outputPath);

    if (taken.has(absolute)) {
      throw new Error(
        `Two images would be written to "${job.outputPath}"; an extra image` +
          ` needs an output path of its own, or one of them is lost.`,
      );
    }

    taken.add(absolute);
  }
}
