import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { resolveConfig } from "../../config/index.js";
import { resolveConfigForSize } from "../../config/size.js";
import { readContentFile } from "../../content/index.js";
import { extensionFor } from "../../encode/index.js";
import { buildSvg, renderSvgToImage } from "../../render/index.js";
import type { ColophonConfig } from "../../types.js";
import { contentRootFor } from "./root.js";
import { pickSize } from "./size.js";

/** What a preview renders: one post, at one size, with one config. */
export interface PreviewOptions {
  readonly file: string;
  readonly config: ColophonConfig | undefined;
  /** Which configured size, or the first of them. */
  readonly size: string | undefined;
}

/**
 * Render one post to a temporary image and return where it landed.
 *
 * The image goes to the system temp directory rather than into the tree,
 * because a preview is not a build output. Beside the post it would land on the
 * real image, which the next build would then find unstamped and render again,
 * so tuning a template would quietly invalidate the tree it was tuned against.
 * Nothing is stamped either, for the matching reason: a preview was asked for,
 * so there is never anything to skip.
 *
 * Only one image is rendered, since the point is to look at it. Every other
 * size the config declares is a `--size` away.
 */
export async function previewImage(options: PreviewOptions): Promise<string> {
  const resolved = resolveConfig(options.config);
  const size = pickSize(resolved.sizes, options.size);

  const file = await readContentFile(
    options.file,
    contentRootFor(options.file),
    options.config?.content,
  );

  if (file === undefined) {
    throw new Error(
      `${options.file} declares no image props, so there is nothing to preview.`,
    );
  }

  const config = resolveConfigForSize(options.config, size);
  const dimensions = { width: size.width, height: size.height };
  const svg = await buildSvg(file.props, config, dimensions);
  const image = await renderSvgToImage(svg, dimensions, config);

  const output = path.join(
    tmpdir(),
    "colophon-preview",
    `${file.slug}-${size.name}${extensionFor(config.format)}`,
  );
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, image);

  return output;
}
