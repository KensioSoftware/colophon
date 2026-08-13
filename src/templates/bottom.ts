import { drawLines } from "../layout/index.js";
import type { LinesStyle, Rect, TextLine } from "../layout/index.js";
import type { ImageAsset, MeasureText, ResolvedConfig } from "../types.js";
import { attribution } from "./attribution.js";
import type { Frame } from "./frame.js";

/** How faint the footer is against the image's own text. */
const defaultOpacity = 0.75;

/**
 * The footer line as most templates want it: on the bottom margin, across the
 * content width, with the post's avatar before it where there is one.
 *
 * Every template ends with the same dozen lines of placement, which is a dozen
 * chances for one of them to drift from the rest. A template wanting something
 * else, such as the `article` with its byline at the other end of the same
 * line, still calls `attribution` itself.
 */
export function footerLine(
  config: ResolvedConfig,
  frame: Frame,
  avatar: ImageAsset | undefined,
  measure: MeasureText,
  align: "start" | "middle" = "start",
  opacity: number = defaultOpacity,
): string {
  const { pad, full } = frame;

  return attribution(
    config,
    {
      x:
        align === "middle" ? Math.round(full.x + full.width / 2) : full.x + pad,
      y: frame.footerY,
      fontSize: frame.footerFontSize,
      opacity,
      ...(align === "middle" && { anchor: "middle" as const }),
      left: full.x + pad,
      width: full.width - pad * 2,
    },
    avatar,
    measure,
  );
}

/**
 * Draw a block of lines in a slot a `stack` handed back, or nothing where
 * there was no slot to draw it in.
 *
 * A stack returns one rectangle per item, so the missing case never happens;
 * it is the type that says otherwise, and every template that stacks its text
 * would otherwise carry the same conditional to prove it.
 */
export function drawSlot(
  lines: readonly TextLine[],
  slot: Rect | undefined,
  style: LinesStyle,
): string {
  return slot === undefined ? "" : drawLines(lines, slot, style);
}
