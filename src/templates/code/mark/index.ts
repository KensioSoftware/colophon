import type { CodeToken } from "../../../highlight/index.js";
import type { MetaImageProps, ResolvedConfig } from "../../../types.js";
import { markSvg } from "./draw.js";
import type { MarkMetrics } from "./draw.js";
import { locateMark } from "./locate.js";
import { readMarks } from "./read.js";

export type { MarkMetrics } from "./draw.js";

/**
 * What a post asked to have marked on its snippet, drawn over the code.
 *
 * A mark that cannot be placed is reported rather than dropped quietly. There
 * are three ways to get one, and an author cannot tell them apart from the
 * image: the text is not in the snippet at all, or it is on a line the fitting
 * dropped, or it was past the width and got clipped. The message says the
 * marks were not found, and the truncation warning beside it says whether
 * there was room for them.
 */
export function codeMarks(
  props: MetaImageProps,
  lines: readonly (readonly CodeToken[])[],
  metrics: MarkMetrics,
  config: ResolvedConfig,
): string {
  // Widened because this arrives from a post's frontmatter: the declared type
  // is what a project means to write, not what the file holds.
  const declared: unknown = props["mark"];
  const missing: string[] = [];
  let drawn = "";

  for (const mark of readMarks(declared, config)) {
    const span = locateMark(mark, lines);

    if (span === undefined) {
      missing.push(mark.text ?? `line ${String(mark.line ?? 0)}`);
      continue;
    }

    drawn += markSvg(span, metrics, config.colors.brandWarm);
  }

  if (missing.length > 0) {
    config.onWarning(
      `code mark ${missing.map((name) => JSON.stringify(name)).join(", ")}` +
        ` not found in the snippet as drawn.`,
    );
  }

  return drawn;
}
