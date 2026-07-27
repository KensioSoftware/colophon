import { availableParallelism } from "node:os";

import type { ContentFile, WalkOptions } from "../content/index.js";
import type { ColophonConfig, OutputSize } from "../types.js";

/**
 * Outcome for one generated (or skipped) image.
 */
export interface GeneratedImage {
  readonly contentPath: string;
  readonly size: OutputSize;
  readonly outputPath: string;
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
