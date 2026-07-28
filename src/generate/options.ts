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
   * naming one — the output path, say — would quietly break anything grouping
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
  /** True when an up-to-date image was left in place (no `overwrite`). */
  readonly skipped: boolean;
}

/**
 * Options for `generate`.
 */
export interface GenerateOptions {
  /** Root content directory to walk. */
  readonly contentDir: string;
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
   * How many images to render at once. Defaults to the number of CPUs the
   * process can use. Must be a positive integer.
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
