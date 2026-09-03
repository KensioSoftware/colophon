import { availableParallelism } from "node:os";

import type { ContentFile, WalkOptions } from "../content/index.js";
import type { ColophonConfig, OutputSize } from "../types.js";

/**
 * Outcome for one generated (or skipped) image.
 */
export interface GeneratedImage {
  /**
   * The content file this image came from, relative to the content root.
   * `undefined` for a config `extra` image: there is no post behind it, and
   * naming one after its output path would quietly break anything grouping
   * results by the post they belong to.
   */
  readonly contentPath: string | undefined;
  readonly size: OutputSize;
  readonly outputPath: string;
  /**
   * Where the image is served, from the configured placement. `undefined`
   * when nothing says: no `urlBase`, an image placed by `outputPath`, or an
   * `extra` that named its own path.
   */
  readonly url: string | undefined;
  /**
   * True when an up-to-date image was left in place (no `overwrite`). Under
   * `dryRun` it says what the build would have done rather than what it did.
   */
  readonly skipped: boolean;
}

/**
 * Options for `generate`.
 */
export interface GenerateOptions {
  /**
   * Root content directory. It is walked for the build's content unless
   * `contentFiles` supplies it, and either way it is the root the
   * `beside-content` placement writes images under.
   *
   * It is optional only because `contentFiles` can stand in for the walk. A
   * build given neither has nothing to render and says so.
   */
  readonly contentDir?: string;
  /**
   * Render this content instead of walking a directory for it, for a project
   * whose pages are not markdown files on disk: rows in a database, an API's
   * responses, or the sharded JSON a large site keeps its entries in.
   * `walkContent` is what builds these from a content tree, and this is the
   * seam a project builds them itself at.
   *
   * `absolutePath` may be left off, since content like that has no file behind
   * it. Everything else is required, and checked, because a slug becomes part
   * of a filename.
   *
   * `walk` describes reading files and has nothing to do here, so passing both
   * is refused rather than quietly ignored.
   */
  readonly contentFiles?: readonly ContentFile[];
  readonly config?: ColophonConfig;
  /** Extra walk options (props key, template field, slug field, extensions). */
  readonly walk?: Omit<WalkOptions, "dir">;
  /** Override where each image is written. */
  readonly outputPath?: (file: ContentFile, size: OutputSize) => string;
  /**
   * Re-render every image, ignoring the stamps that would otherwise mark them
   * as up to date. Default `false`.
   */
  readonly overwrite?: boolean;
  /**
   * Work out what the build would do and write nothing: no images, and no
   * manifest. Every check a real build makes still runs, so a dry run is also
   * how to find a config that would fail before it writes anything. Default
   * `false`.
   */
  readonly dryRun?: boolean;
  /**
   * How many images to render at once. Defaults to the number of CPUs the
   * process can use. Must be a positive integer.
   *
   * The parts of a render that take real time (the rasteriser, the PNG
   * recompression and the quantiser) all run on the libuv thread pool. That
   * pool has four threads unless `UV_THREADPOOL_SIZE` says otherwise, so on a
   * machine with more cores than that a higher concurrency only queues work
   * up. libuv sizes the pool from the environment before the process starts,
   * and a build can only read it. Where the pool is the smaller of the two,
   * `generate` warns.
   */
  readonly concurrency?: number;
  /** Called after each image is written or skipped. */
  readonly onResult?: (result: GeneratedImage) => void;
}

/**
 * How many images to render at once when nothing is configured: one per CPU
 * the process can actually use. Rasterising is CPU-bound, so starting more
 * than that only queues the work up while holding every pending image in
 * memory.
 *
 * The real ceiling is the smaller of this and the libuv thread pool. That
 * pool holds four threads unless `UV_THREADPOOL_SIZE` was set in the
 * environment, so the default here is reached on a machine of four cores or
 * fewer, or with the pool sized to match. `generate` warns where the two
 * disagree.
 */
export function resolveConcurrency(concurrency: number | undefined): number {
  if (concurrency === undefined) {
    return availableParallelism();
  }

  if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
    throw new Error(
      `Invalid concurrency ${String(concurrency)}; expected a positive integer.`,
    );
  }

  return concurrency;
}
