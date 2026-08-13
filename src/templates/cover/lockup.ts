import type { Rect, TextLine } from "../../layout/index.js";
import { image, row } from "../../layout/index.js";
import type { ImageAsset, MeasureText } from "../../types.js";

/** The mark's height, as a fraction of the room the lockup has. */
const markScale = 0.72;

/** The clear space between the mark and the words, of the same room. */
const markGapScale = 0.24;

/** The widest of a block of lines, which is how wide the block is. */
export function linesWidth(
  lines: readonly TextLine[],
  measure: MeasureText,
  fontFamily: string,
): number {
  return lines.reduce(
    (widest, line) =>
      Math.max(
        widest,
        measure(line.text, {
          fontFamily,
          fontSize: line.fontSize,
          fontWeight: line.fontWeight,
        }),
      ),
    0,
  );
}

/** The room the mark takes along the row, including the gap after it. */
export interface Mark {
  readonly width: number;
  readonly gap: number;
}

/**
 * How much of the row the mark claims, or nothing at all where the project has
 * no logo, which is what takes the gap with it.
 *
 * The width and the gap come back together because the words need both before
 * they can be fitted, and deriving either of them twice is how the room
 * reserved stops matching the room used.
 */
export function markSpace(
  logo: ImageAsset | undefined,
  contentHeight: number,
): Mark {
  if (logo === undefined) {
    return { width: 0, gap: 0 };
  }

  return {
    width: Math.round(Math.round(contentHeight * markScale) * logo.aspect),
    gap: Math.round(contentHeight * markGapScale),
  };
}

/** Where the mark and the words go: side by side, centred in the area. */
export interface Lockup {
  readonly mark: Rect | undefined;
  readonly text: Rect;
}

/**
 * Set the mark beside the words and centre the pair.
 *
 * A cover is a strip between about 2.6:1 and 6:1, so the mark goes next to the
 * name rather than above it as the `wordmark` template has it: stacked, three
 * elements in 400px of height leave nothing legible. The words are then set
 * from the left of the slot they were given rather than centred within it, so
 * that a wrapped name lines up under itself and the whole lockup still sits in
 * the middle.
 *
 * A project with no logo takes the same path with a mark of no width, which is
 * one arrangement rather than two: `row` centres a single item exactly as it
 * centres a pair.
 */
export function lockup(area: Rect, mark: Mark, textWidth: number): Lockup {
  const [markSlot, textSlot] = row(
    [{ size: mark.width }, { size: textWidth, gapBefore: mark.gap }],
    area,
  );

  return {
    mark: mark.width === 0 ? undefined : markSlot,
    text: textSlot ?? area,
  };
}

/**
 * The mark, centred down the slot it was given.
 *
 * Its height comes from the room the lockup has rather than from the slot,
 * which is the whole content area tall: `row` gives every item the full height
 * so that each can sit where it likes within it.
 */
export function markElement(
  logo: ImageAsset | undefined,
  slot: Rect | undefined,
): string {
  if (logo === undefined || slot === undefined) {
    return "";
  }

  const height = Math.round(slot.height * markScale);

  return image(
    {
      x: slot.x,
      y: Math.round(slot.y + (slot.height - height) / 2),
      width: slot.width,
      height,
    },
    logo.href,
    { fit: "contain" },
  );
}
