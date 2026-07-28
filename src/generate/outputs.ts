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

/** What to call a job in a message: the post it came from, or its path. */
function describe(job: RenderJob): string {
  return job.contentPath ?? `extra "${job.outputPath}"`;
}

/**
 * Reject a manifest written over one of the images it describes.
 *
 * The manifest is written last, so it wins: the image is replaced by JSON, and
 * — its stamp gone with it — rendered again on every build afterwards. It is
 * the same collision as two images sharing a path, so it is answered here,
 * where a path is already compared the way the filesystem would.
 */
export function assertManifestIsNotAnImage(
  manifestPath: string | undefined,
  jobs: readonly RenderJob[],
): void {
  if (manifestPath === undefined) {
    return;
  }

  const key = comparable(manifestPath);
  const clash = jobs.find((job) => comparable(job.outputPath) === key);

  if (clash !== undefined) {
    throw new Error(
      `The manifest path "${manifestPath}" is where ${describe(clash)} is` +
        ` written. The manifest is written last, so it would replace the` +
        ` image; give one of them a path of its own.`,
    );
  }
}

/**
 * Reject a build in which two images would be written to one path.
 *
 * They do not merely lose an image between them: each stamps the file with its
 * own digest, so every later build finds a stamp that does not match and
 * renders both again, for ever.
 *
 * Every job is checked, posts included. That used to be older ground worth
 * leaving alone — two posts collided only if they shared a directory and a
 * slug — but `public-dir` gathers a whole tree into one directory, where every
 * post sharing a basename with another lands on it. Naming both sides is what
 * makes that worth reporting: the path alone does not say which two posts.
 *
 * Paths are compared resolved, since a placement names an absolute path and an
 * extra names whatever the config wrote.
 */
export function assertDistinctOutputs(jobs: readonly RenderJob[]): void {
  const taken = new Map<string, RenderJob>();

  for (const job of jobs) {
    const key = comparable(job.outputPath);
    const first = taken.get(key);

    if (first !== undefined) {
      throw new Error(
        `Two images would be written to "${job.outputPath}":` +
          ` ${describe(first)} and ${describe(job)}. Each image needs a path` +
          ` of its own, or one is lost and both re-render on every build.`,
      );
    }

    taken.set(key, job);
  }
}
