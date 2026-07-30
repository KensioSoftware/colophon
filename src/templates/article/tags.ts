import { row, stringList } from "../../layout/index.js";
import type { Rect } from "../../layout/index.js";
import type {
  Dimensions,
  MeasureText,
  MetaImageProps,
  ResolvedConfig,
} from "../../types.js";
import type { PillStyle } from "../pill.js";
import { pill, pillWidth } from "../pill.js";

/** The tags' height, as a fraction of the image's. */
const heightScale = 0.05;

/** Space between one tag and the next, as a fraction of their height. */
const gapScale = 0.3;

/**
 * A row of tags along the top of the image.
 *
 * Tags that do not fit are dropped rather than being wrapped onto a second
 * line or shrunk. A post's tag list is written for its own pages, where there
 * is a sidebar to hold all nine of them, and the share image wants the first
 * two or three of that list as a hint at the subject. Growing to fit them all
 * would take the room the title is drawn in.
 */
export function tagRow(
  tags: readonly string[],
  area: Rect,
  style: PillStyle,
  measure: MeasureText,
): string {
  const gap = Math.round(area.height * gapScale);
  const widths: number[] = [];
  let used = 0;

  for (const tag of tags) {
    const width = pillWidth(tag, area.height, style, measure);
    const advance = width + (widths.length === 0 ? 0 : gap);

    if (used + advance > area.width) {
      break;
    }

    widths.push(width);
    used += advance;
  }

  const placed = row(
    widths.map((size, index) => ({
      size,
      ...(index > 0 && { gapBefore: gap }),
    })),
    area,
    "start",
  );

  return placed
    .map((rect, index) => pill(tags[index] ?? "", rect, style))
    .join("");
}

/**
 * The row of tags along the top, and how much room it took.
 *
 * Both are wanted at once: the tags are drawn from the top margin, and the
 * headline underneath starts below whichever of them and the logo reaches
 * furthest down.
 */
export function tagBand(
  props: MetaImageProps,
  config: ResolvedConfig,
  dimensions: Dimensions,
  pad: number,
  reserved: number,
  measure: MeasureText,
): { readonly svg: string; readonly height: number } {
  const tags = stringList(props["tags"]);
  const height =
    tags.length === 0 ? 0 : Math.round(dimensions.height * heightScale);

  return {
    height,
    svg: tagRow(
      tags,
      {
        x: pad,
        y: pad,
        width: dimensions.width - pad * 2 - reserved,
        height,
      },
      {
        fontFamily: config.fontFamily,
        fontWeight: 700,
        fill: config.colors.foreground,
        background: config.colors.foreground,
        backgroundOpacity: 0.16,
      },
      measure,
    ),
  };
}
