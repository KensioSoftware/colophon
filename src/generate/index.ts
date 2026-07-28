import { mapConcurrent } from "../pool.js";
import { readPngStamp } from "../stamp/index.js";
import type { GeneratedImage, GenerateOptions } from "./options.js";
import { resolveConcurrency } from "./options.js";
import { planBuild } from "./plan.js";
import { renderImage } from "./render-image.js";

export { defaultOutputPath } from "./output-path.js";
export type { GeneratedImage, GenerateOptions } from "./options.js";

/**
 * Walk a content tree and render meta images for every file that declares
 * props, writing PNGs to disk. Images the config declares outright under
 * `extra` are rendered by the same pass, on the same terms.
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
  const plan = await planBuild(options);

  return mapConcurrent(plan.jobs, concurrency, async (job) => {
    const stamp = plan.stamper.stamp(job.props, job.size);
    const isSkipped =
      options.overwrite !== true &&
      (await readPngStamp(job.outputPath)) === stamp;

    if (!isSkipped) {
      await renderImage(job, stamp);
    }

    const result: GeneratedImage = {
      contentPath: job.contentPath,
      size: job.size,
      outputPath: job.outputPath,
      url: job.url,
      skipped: isSkipped,
    };
    options.onResult?.(result);
    return result;
  });
}
