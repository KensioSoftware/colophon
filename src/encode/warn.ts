import { MINIMUM_QUALITY } from "../config/defaults.js";
import type { ResolvedConfig } from "../types.js";

/** A byte count as somebody would write it down. */
function inKilobytes(bytes: number): string {
  return `${Math.round(bytes / 1024).toLocaleString("en")}KB`;
}

/** What could still be done about an image that would not fit. */
function remedy(format: ResolvedConfig["format"]): string {
  if (format === "png") {
    return (
      "PNG is lossless and has no quality to trade, so nothing was stepped" +
      " down; set format to webp, jpeg or avif for a cap that can act."
    );
  }

  return (
    `Quality was stepped down to ${String(MINIMUM_QUALITY)}, which is as far` +
    " as it goes before the picture stops being worth having. A smaller" +
    " output size would do what quality no longer can."
  );
}

/**
 * Report an image that is over the configured cap.
 *
 * It is a warning rather than an error because the image is still the right
 * image: a build that renders nothing is a worse answer than one that renders
 * something too big for X and says which post it was.
 */
export function warnIfOverCap(image: Buffer, config: ResolvedConfig): void {
  const cap = config.maxBytes;

  if (cap === undefined || image.length <= cap) {
    return;
  }

  config.onWarning(
    `Image is ${inKilobytes(image.length)}, over the` +
      ` ${inKilobytes(cap)} maxBytes cap. ${remedy(config.format)}`,
  );
}
