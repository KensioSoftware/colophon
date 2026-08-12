import { box } from "../../layout/index.js";
import type { BoxStyle } from "../../layout/index.js";

/** Which buttons a window's bar carries. */
export type WindowDots = "mono" | "macos";

/**
 * The three buttons, in the colours every reader has seen on a window.
 *
 * They are not the site's colours and are not meant to be. The point of the
 * chrome is that the image is recognised as a window before a word of it is
 * read, and these are what does the recognising.
 *
 * The neutral set says the same thing without borrowing an operating system's
 * colours, which is what a snippet on a site with a palette of its own usually
 * wants. The terminal draws the coloured ones, since a terminal is a window
 * somebody has seen rather than a decorated panel.
 */
const macosButtons: readonly string[] = ["#ff5f57", "#febc2e", "#28c840"];

/** One button's fill, which for the neutral set is the bar's own tone. */
function buttonStyle(dots: WindowDots, index: number): BoxStyle {
  return dots === "macos"
    ? { fill: macosButtons[index] ?? "#ffffff" }
    : { fill: "#ffffff", fillOpacity: 0.28 };
}

/** Where the buttons sit in the bar, and how big they are. */
export interface DotsLayout {
  readonly left: number;
  readonly middle: number;
  readonly diameter: number;
}

/** The row of buttons at the left of the bar. */
export function windowDots(dots: WindowDots, layout: DotsLayout): string {
  const { left, middle, diameter } = layout;
  const gap = Math.round(diameter * 1.7);

  return Array.from({ length: macosButtons.length }, (_unused, index) =>
    box(
      {
        x: left + index * gap,
        y: middle - Math.round(diameter / 2),
        width: diameter,
        height: diameter,
      },
      { radius: Math.round(diameter / 2), ...buttonStyle(dots, index) },
    ),
  ).join("");
}
