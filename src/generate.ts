import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { resolveConfig } from "./config.js";
import type { ContentFile, WalkOptions } from "./content/index.js";
import { walkContent } from "./content/index.js";
import { buildSvg, renderSvgToPng } from "./render.js";
import type { ColophonConfig, OutputSize } from "./types.js";

/**
 * Outcome for one generated (or skipped) image.
 */
export interface GeneratedImage {
  readonly contentPath: string;
  readonly size: OutputSize;
  readonly outputPath: string;
  /** True when an existing file was left in place (no `overwrite`). */
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
  /** Re-render even when the output file already exists. Default `false`. */
  readonly overwrite?: boolean;
  /** Called after each image is written or skipped. */
  readonly onResult?: (result: GeneratedImage) => void;
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
 * props, writing PNGs to disk. Existing files are skipped unless `overwrite`
 * is set (matching the original script's behaviour), and skipped sizes are
 * never rendered.
 */
export async function generate(
  options: GenerateOptions,
): Promise<GeneratedImage[]> {
  const resolved = resolveConfig(options.config);
  const toOutputPath = options.outputPath ?? defaultOutputPath;
  const files = await walkContent({ dir: options.contentDir, ...options.walk });

  const jobs = files.flatMap((file) =>
    resolved.sizes.map((size) => ({ file, size })),
  );

  return Promise.all(
    jobs.map(async ({ file, size }) => {
      const outputPath = toOutputPath(file, size);
      const isSkipped = existsSync(outputPath) && options.overwrite !== true;

      if (!isSkipped) {
        const dimensions = { width: size.width, height: size.height };
        // Warnings name the post they came from: a build renders many images,
        // and "shorten the sample" is no use without knowing which sample.
        const config = {
          ...resolved,
          onWarning: (message: string): void => {
            resolved.onWarning(`${file.contentPath}: ${message}`);
          },
        };
        const svg = await buildSvg(file.props, config, dimensions);
        const png = await renderSvgToPng(svg, dimensions, config);
        await mkdir(path.dirname(outputPath), { recursive: true });
        await writeFile(outputPath, png);
      }

      const result: GeneratedImage = {
        contentPath: file.contentPath,
        size,
        outputPath,
        skipped: isSkipped,
      };
      options.onResult?.(result);
      return result;
    }),
  );
}
