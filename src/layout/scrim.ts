import { box } from "./box.js";
import type { Rect } from "./types.js";

/** How heavily a scrim shades what is under it, and from which edge. */
export interface ScrimOptions {
  readonly color?: string;
  /** Opacity at the top edge. Defaults to none, so the image shows through. */
  readonly from?: number;
  /** Opacity at the bottom edge. */
  readonly to?: number;
}

const defaultColor = "#000000";

/**
 * A wash of colour over an image, so that text on top of it can be read.
 *
 * This is the difference between a designed image and text sitting on a photo.
 * A photograph has light and dark in it wherever it likes, and white text over
 * a bright sky is invisible; a gradient from clear at the top to dark at the
 * bottom keeps a headline legible without hiding the picture.
 *
 * `id` names the gradient and has to be unique within the image. A flat wash
 * needs no gradient, so it needs no `id` either: pass the same value for
 * `from` and `to`.
 */
export function scrim(
  rect: Rect,
  id: string,
  options: ScrimOptions = {},
): string {
  const color = options.color ?? defaultColor;
  const from = options.from ?? 0;
  const to = options.to ?? 0.55;

  if (from === to) {
    return box(rect, { fill: color, fillOpacity: from });
  }

  const gradient =
    `<defs>` +
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="${color}" stop-opacity="${String(from)}"/>` +
    `<stop offset="100%" stop-color="${color}" stop-opacity="${String(to)}"/>` +
    `</linearGradient>` +
    `</defs>`;

  return gradient + box(rect, { fill: `url(#${id})` });
}
