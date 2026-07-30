import type { Dimensions, ResolvedConfig } from "../../types.js";

function plural(count: number, noun: string): string {
  return `${String(count)} ${noun}${count === 1 ? "" : "s"}`;
}

/**
 * Tell the author when the snippet did not fit. Nothing in a finished image
 * says the sample continued, so silent truncation is how a half-a-function
 * share card ends up on someone else's timeline.
 */
export function warnIfTruncated(
  config: ResolvedConfig,
  dimensions: Dimensions,
  counts: { readonly dropped: number; readonly clipped: number },
  total: number,
  subject = "code snippet",
): void {
  const parts: string[] = [];

  if (counts.dropped > 0) {
    parts.push(`${String(counts.dropped)} of ${plural(total, "line")} dropped`);
  }

  if (counts.clipped > 0) {
    parts.push(`${plural(counts.clipped, "line")} clipped to the panel width`);
  }

  if (parts.length === 0) {
    return;
  }

  config.onWarning(
    `${subject} does not fit the ${String(dimensions.width)}x${String(dimensions.height)}` +
      ` image at a legible size: ${parts.join(", ")}.` +
      ` Shorten the sample, or lower code.minFontScale to fit it in smaller.`,
  );
}
