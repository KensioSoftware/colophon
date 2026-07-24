import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { resolveConfig } from "./config.js";
import type { ContentFile, WalkOptions } from "./content/index.js";
import { walkContent } from "./content/index.js";
import { buildSvg, renderSvgToPng } from "./render.js";
import type { ColophonConfig, Dimensions } from "./types.js";

/**
 * Outcome for one generated (or skipped) image.
 */
export interface GeneratedImage {
  readonly contentPath: string;
  readonly dimensions: Dimensions;
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
  /** Extra walk options (props key, template field, extensions, …). */
  readonly walk?: Omit<WalkOptions, "dir">;
  /** Override where each image is written. */
  readonly outputPath?: (
    file: ContentFile,
    dimensions: Dimensions,
    index: number,
  ) => string;
  /** Re-render even when the output file already exists. Default `false`. */
  readonly overwrite?: boolean;
  /** Called after each image is written or skipped. */
  readonly onResult?: (result: GeneratedImage) => void;
}

/**
 * Default output path: alongside the content file, named after the file (or
 * its parent directory when the file is `index.*`). The first (square) size
 * keeps the bare name; additional sizes get a `-WxH` suffix.
 */
export function defaultOutputPath(
  file: ContentFile,
  dimensions: Dimensions,
  index: number,
): string {
  const directory = path.dirname(file.absolutePath);
  const extension = path.extname(file.contentPath);
  const base = path.basename(file.contentPath, extension);
  const stem = base === "index" ? path.basename(directory) : base;
  const suffix =
    index === 0
      ? ""
      : `-${String(dimensions.width)}x${String(dimensions.height)}`;

  return path.join(directory, `${stem}${suffix}.png`);
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
    resolved.dimensions.map((dimensions, index) => ({
      file,
      dimensions,
      index,
    })),
  );

  return Promise.all(
    jobs.map(async ({ file, dimensions, index }) => {
      const outputPath = toOutputPath(file, dimensions, index);
      const isSkipped = existsSync(outputPath) && options.overwrite !== true;

      if (!isSkipped) {
        const svg = buildSvg(file.props, resolved, dimensions);
        const png = await renderSvgToPng(svg, dimensions);
        await mkdir(path.dirname(outputPath), { recursive: true });
        await writeFile(outputPath, png);
      }

      const result: GeneratedImage = {
        contentPath: file.contentPath,
        dimensions,
        outputPath,
        skipped: isSkipped,
      };
      options.onResult?.(result);
      return result;
    }),
  );
}
