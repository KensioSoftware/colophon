import { writeManifest } from "../manifest/index.js";
import { mapConcurrent } from "../pool.js";
import { readImageStamp } from "../stamp/index.js";
import type { GeneratedImage, GenerateOptions } from "./options.js";
import { resolveConcurrency } from "./options.js";
import { planBuild } from "./plan.js";
import { renderImage } from "./render-image.js";
import { warnIfPoolIsSmaller } from "./thread-pool.js";

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
 * large tree does not start hundreds of rasterisations at once. How many of
 * those make progress at a time is the libuv thread pool's business, and a
 * build asking for more than the pool has says so in a warning. See
 * {@link GenerateOptions.concurrency}.
 *
 * `dryRun` stops short of writing: the plan is built and the stamps are read,
 * so the results say which images are out of date, but nothing is rendered and
 * no manifest is written.
 */
export async function generate(
  options: GenerateOptions,
): Promise<GeneratedImage[]> {
  const concurrency = resolveConcurrency(options.concurrency);
  const plan = await planBuild(options);
  warnIfPoolIsSmaller(concurrency, plan.config.onWarning);

  const results = await mapConcurrent(plan.jobs, concurrency, async (job) => {
    const isSkipped =
      options.overwrite !== true &&
      (await readImageStamp(job.outputPath)) === job.stamp;

    if (!isSkipped && options.dryRun !== true) {
      await renderImage(job, job.stamp);
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

  // Written last, and only once every image is on disk: a manifest naming a
  // file that failed to render would outlive the build that failed.
  if (options.dryRun !== true) {
    await writeManifest(plan.manifest);
  }

  return results;
}
