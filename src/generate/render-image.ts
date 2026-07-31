import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { withExtension } from "../encode/index.js";
import { buildSvg, renderSvgToImage } from "../render/index.js";
import { stampImage } from "../stamp/index.js";
import type { ResolvedConfig } from "../types.js";
import type { RenderJob } from "./job.js";

/**
 * Render one image and write it, stamped, to its output path, creating
 * whatever directories that path needs.
 *
 * Warnings name the image they came from: a build renders many, and "shorten
 * the sample" is no use without knowing which sample. An extra image has no
 * content file to name, so it is named by where it is being written.
 *
 * Under `emitSvg` the document the raster was made from is written beside it,
 * under the same name with an `.svg` extension. Replacing the extension rather
 * than appending one keeps a hashed filename's hash where a reader expects it,
 * and sorts the pair together. It carries no stamp, because an image is what a
 * build tracks and this is only ever written when one has just been rendered.
 */
export async function renderImage(
  job: RenderJob,
  stamp: string,
): Promise<void> {
  const dimensions = { width: job.size.width, height: job.size.height };
  const source = job.contentPath ?? job.outputPath;
  const config: ResolvedConfig = {
    ...job.config,
    onWarning: (message: string): void => {
      job.config.onWarning(`${source}: ${message}`);
    },
  };

  const svg = await buildSvg(job.props, config, dimensions);
  const image = await renderSvgToImage(svg, dimensions, config);

  await mkdir(path.dirname(job.outputPath), { recursive: true });
  await writeFile(job.outputPath, stampImage(image, stamp));

  if (config.emitSvg) {
    await writeFile(withExtension(job.outputPath, ".svg"), svg);
  }
}
