import type { MeasureAt } from "../../layout/index.js";

/** What goes between two segments of the trail. */
const separator = " / ";

/** What stands for the segments that were dropped. */
const elided = "…";

/**
 * The breadcrumb as one line, narrow enough for the width it has.
 *
 * Segments are dropped from the front rather than the back, and an ellipsis
 * put in their place. The trail's last segments say where the page sits and
 * its first say which site it is on, and the reader can see the site from
 * everything else in the image.
 *
 * It is never wrapped or shrunk. A breadcrumb is chrome: two lines of it would
 * be competing with the title, which is the thing being shared.
 */
export function crumbLine(
  parts: readonly string[],
  maxWidth: number,
  measure: MeasureAt,
  fontSize: number,
): string | undefined {
  if (parts.length === 0) {
    return undefined;
  }

  for (let from = 0; from < parts.length; from += 1) {
    const kept = parts.slice(from);
    const line = (from === 0 ? kept : [elided, ...kept]).join(separator);

    if (measure(line, fontSize) <= maxWidth) {
      return line;
    }
  }

  return parts.at(-1);
}
