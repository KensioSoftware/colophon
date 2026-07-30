import {
  baselineFor,
  box,
  clampLine,
  measureIn,
  textElement,
} from "../../layout/index.js";
import type { Rect } from "../../layout/index.js";
import type { MeasureText } from "../../types.js";

/**
 * How many changes are drawn.
 *
 * A changelog has as many entries as it has, and a share image showing all of
 * them is a wall of small text nobody reads in a feed. Four is what fits at a
 * size that can be read, and the post itself is where the rest of them are.
 */
export const maxChanges = 4;

/** Vertical advance from one change to the next, as a multiple of its size. */
const step = 1.85;

/** The bullet's diameter, as a fraction of the text's size. */
const bulletScale = 0.26;

/** How a list of changes is set. */
export interface ChangeStyle {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fill: string;
  /** The bullets' colour, which is what marks the list as a list. */
  readonly accent: string;
}

/** The room a list of this many changes takes. */
export function changesHeight(count: number, fontSize: number): number {
  return count === 0 ? 0 : Math.round((count - 1) * fontSize * step + fontSize);
}

/** One change: its bullet, then the line, cut to the width it has. */
function change(
  text: string,
  top: number,
  area: Rect,
  style: ChangeStyle,
  measure: MeasureText,
): string {
  const { fontSize } = style;
  const indent = Math.round(fontSize * 0.95);
  const diameter = Math.round(fontSize * bulletScale);

  return (
    box(
      {
        x: area.x,
        y: Math.round(top + (fontSize - diameter) / 2),
        width: diameter,
        height: diameter,
      },
      { radius: Math.round(diameter / 2), fill: style.accent },
    ) +
    textElement(
      clampLine(
        text,
        area.width - indent,
        measureIn(measure, style.fontFamily, 500),
        fontSize,
      ),
      {
        x: area.x + indent,
        y: baselineFor(top, fontSize),
        fontFamily: style.fontFamily,
        fontSize,
        fontWeight: 500,
        fill: style.fill,
        fillOpacity: 0.9,
      },
    )
  );
}

/** The list of changes, drawn down from the top of the space it was given. */
export function changeList(
  items: readonly string[],
  area: Rect,
  style: ChangeStyle,
  measure: MeasureText,
): string {
  return items
    .map((text, index) =>
      change(
        text,
        area.y + Math.round(index * style.fontSize * step),
        area,
        style,
        measure,
      ),
    )
    .join("");
}
