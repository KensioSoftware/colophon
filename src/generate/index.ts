import { mapConcurrent } from "../pool.js";
import { readPngStamp } from "../stamp/index.js";
import { defaultOutputPath } from "./output-path.js";
import type { GeneratedImage, GenerateOptions } from "./options.js";
import { resolveConcurrency } from "./options.js";
import { planBuild } from "./plan.js";
import { renderImage } from "./render-image.js";

export { defaultOutputPath } from "./output-path.js";
export type { GeneratedImage, GenerateOptions } from "./options.js";

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
  const concurrency = resolveConcurrency(options.concurrency);
  const toOutputPath = options.outputPath ?? defaultOutputPath;
  const plan = await planBuild(options);

  return mapConcurrent(plan.jobs, concurrency, async ({ file, size }) => {
    const outputPath = toOutputPath(file, size);
    const stamp = plan.stamper.stamp(file.props, size);
    const isSkipped =
      options.overwrite !== true && (await readPngStamp(outputPath)) === stamp;

    if (!isSkipped) {
      const config = plan.configBySize.get(size.name) ?? plan.fallbackConfig;
      await renderImage(file, size, config, outputPath, stamp);
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
