import type { CliArgs } from "../args/index.js";
import { loadConfig } from "../config.js";
import { openFile } from "./open.js";
import { previewImage } from "./render.js";

export { previewImage } from "./render.js";
export type { PreviewOptions } from "./render.js";

/**
 * Render one post and open the image.
 *
 * Tuning a template, a palette or a snippet otherwise means running the whole
 * build and finding the one image it produced that was the point. The path is
 * printed as well as opened, so a shell that would rather do its own thing with
 * the file can.
 */
export async function runPreview(args: CliArgs): Promise<void> {
  if (args.file === undefined) {
    throw new Error(
      "colophon preview needs a content file, as in" +
        " `colophon preview content/post/index.md`.",
    );
  }

  const config = await loadConfig(args.configPath);
  const output = await previewImage({
    file: args.file,
    config,
    size: args.size,
  });

  console.log(output);
  openFile(output);
}
