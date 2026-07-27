import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ContentFile } from "../content/index.js";
import { buildSvg, renderSvgToPng } from "../render/index.js";
import { stampPng } from "../stamp/index.js";
import type { OutputSize, ResolvedConfig } from "../types.js";

/**
 * Render one image and write it, stamped, to `outputPath`, creating whatever
 * directories the path needs.
 *
 * Warnings name the post they came from: a build renders many images, and
 * "shorten the sample" is no use without knowing which sample.
 */
export async function renderImage(
  file: ContentFile,
  size: OutputSize,
  sizeConfig: ResolvedConfig,
  outputPath: string,
  stamp: string,
): Promise<void> {
  const dimensions = { width: size.width, height: size.height };
  const config: ResolvedConfig = {
    ...sizeConfig,
    onWarning: (message: string): void => {
      sizeConfig.onWarning(`${file.contentPath}: ${message}`);
    },
  };

  const svg = await buildSvg(file.props, config, dimensions);
  const png = await renderSvgToPng(svg, dimensions, config);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, stampPng(png, stamp));
}
