import { mkdir, writeFile } from "node:fs/promises";
import { availableParallelism } from "node:os";
import path from "node:path";

import { resolveConfig, resolveConfigForSize } from "./config.js";
import type { ContentFile, WalkOptions } from "./content/index.js";
import { walkContent } from "./content/index.js";
import { mapConcurrent } from "./pool.js";
import { buildSvg, renderSvgToPng } from "./render.js";
import { createStamper, readPngStamp, stampPng } from "./stamp.js";
import type { ColophonConfig, OutputSize } from "./types.js";

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
 * Options for {@link generate}.
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
function resolveConcurrency(concurrency: number | undefined): number {
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

/**
 * Default output path: alongside the content file, named `<slug>-<size>.png`.
 * The slug carries the post's keywords into the filename and the size name
 * keeps every image distinct (e.g. `my-post-og.png`, `my-post-square.png`).
 */
export function defaultOutputPath(file: ContentFile, size: OutputSize): string {
  const directory = path.dirname(file.absolutePath);
  return path.join(directory, `${file.slug}-${size.name}.png`);
}

/**
 * Walk a content tree and render meta images for every file that declares
 * props, writing PNGs to disk.
 *
 * Each image is stamped with a digest of the props, config and size it came
 * from, so a rebuild renders only what has actually changed: an image whose
 * stamp still matches is left alone, and one whose title, colours or template
 * has moved on is rendered again. `overwrite` ignores the stamps and renders
 * everything. Sizes with no image to render are never rasterised.
 *
 * Rendering runs `concurrency` images at a time rather than all of them, so a
 * large tree does not start hundreds of rasterisations at once.
 */
export async function generate(
  options: GenerateOptions,
): Promise<GeneratedImage[]> {
  const resolved = resolveConfig(options.config);
  const concurrency = resolveConcurrency(options.concurrency);
  const toOutputPath = options.outputPath ?? defaultOutputPath;
  // Resolved once per size rather than once per image: the overrides are the
  // same for every post, and resolving re-reads the configured font files.
  const configBySize = new Map(
    resolved.sizes.map((size) => [
      size.name,
      resolveConfigForSize(options.config, size),
    ]),
  );
  const [stamper, files] = await Promise.all([
    createStamper(resolved),
    walkContent({ dir: options.contentDir, ...options.walk }),
  ]);

  const jobs = files.flatMap((file) =>
    resolved.sizes.map((size) => ({ file, size })),
  );

  return mapConcurrent(jobs, concurrency, async ({ file, size }) => {
    const outputPath = toOutputPath(file, size);
    const stamp = stamper.stamp(file.props, size);
    const isSkipped =
      options.overwrite !== true && (await readPngStamp(outputPath)) === stamp;

    if (!isSkipped) {
      const dimensions = { width: size.width, height: size.height };
      const sizeConfig = configBySize.get(size.name) ?? resolved;
      // Warnings name the post they came from: a build renders many images,
      // and "shorten the sample" is no use without knowing which sample.
      const config = {
        ...sizeConfig,
        onWarning: (message: string): void => {
          resolved.onWarning(`${file.contentPath}: ${message}`);
        },
      };
      const svg = await buildSvg(file.props, config, dimensions);
      const png = await renderSvgToPng(svg, dimensions, config);
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, stampPng(png, stamp));
    }

    const result: GeneratedImage = {
      contentPath: file.contentPath,
      size,
      outputPath,
      skipped: isSkipped,
    };
    options.onResult?.(result);
    return result;
  });
}
