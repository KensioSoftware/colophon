import { textElement } from "../text/index.js";
import type { TextLine } from "./block.js";
import { defaultLineHeight } from "./extent.js";
import { placeLines } from "./lines.js";
import type { Align, Rect } from "./types.js";

/** How a block of lines is drawn: the font, the fill, and where it sits. */
export interface LinesStyle {
  readonly fontFamily: string;
  readonly fill: string;
  /** Multiplier on each line's font size. Defaults to `1.2`. */
  readonly lineHeight?: number;
  /** Horizontal anchor. `middle` centres each line in the area. */
  readonly anchor?: "start" | "middle" | "end";
  /** Where the block sits vertically in the area. Defaults to `centre`. */
  readonly align?: Align;
}

/** The x a line is drawn from, which the anchor decides. */
function anchorX(area: Rect, anchor: LinesStyle["anchor"]): number {
  if (anchor === "middle") {
    return Math.round(area.x + area.width / 2);
  }

  return anchor === "end" ? area.x + area.width : area.x;
}

/**
 * Draw a block of lines within an area: place them, then write the `<text>`
 * elements. Once a template has fitted its words, this is the whole of what it
 * does with them.
 */
export function drawLines(
  lines: readonly TextLine[],
  area: Rect,
  style: LinesStyle,
): string {
  const placed = placeLines(
    lines,
    area,
    style.lineHeight ?? defaultLineHeight,
    style.align ?? "centre",
  );
  const x = anchorX(area, style.anchor);

  return lines
    .map((line, index) =>
      textElement(line.text, {
        x,
        y: placed[index]?.y ?? area.y,
        fontFamily: style.fontFamily,
        fontSize: line.fontSize,
        fontWeight: line.fontWeight,
        fill: style.fill,
        fillOpacity: line.opacity,
        ...(style.anchor !== undefined && { anchor: style.anchor }),
        ...(line.letterSpacing !== undefined && {
          letterSpacing: line.letterSpacing,
        }),
      }),
    )
    .join("");
}
