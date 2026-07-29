import type { Rect } from "./layout/index.js";
import { box, image as imageElement, scrim } from "./layout/index.js";
import type { Background, Dimensions, ImageAsset, Scrim } from "./types.js";

/** Behind a background image, and either side of one that is `contain`ed. */
const defaultBackdrop = "#000000";

/**
 * How heavily the default scrim shades, top and bottom.
 *
 * It starts at a quarter rather than at nothing, because a template is free to
 * put its text anywhere and a wash that only darkens the bottom leaves a
 * centred title sitting on whatever the middle of the photograph happens to
 * be. Shading the whole picture a little and the bottom a lot covers both, and
 * a project that wants the picture untouched at the top sets `from: 0`.
 */
const defaultScrim = { from: 0.25, to: 0.65 };

/**
 * A photograph behind the text: the backdrop, the picture, and the wash over
 * it that keeps the text readable.
 *
 * The scrim is on by default and has to be turned off rather than on. Text
 * over an unshaded photo is the failure this would otherwise ship with, and it
 * is not one an author notices unless they look at every image.
 */
function imageBackground(
  background: Extract<Background, { readonly type: "image" }>,
  area: Rect,
  id: string,
  asset: ImageAsset | undefined,
): string {
  const backdrop = box(area, { fill: background.color ?? defaultBackdrop });

  if (asset === undefined) {
    return backdrop;
  }

  const shade: Scrim = background.scrim ?? {};

  return (
    backdrop +
    imageElement(area, asset.href, { fit: background.fit ?? "cover" }) +
    scrim(area, `${id}-scrim`, {
      ...(shade.color !== undefined && { color: shade.color }),
      from: shade.from ?? defaultScrim.from,
      to: shade.to ?? defaultScrim.to,
    })
  );
}

/**
 * Render a full-bleed background as SVG. For a gradient, this emits a `<defs>`
 * block with a `<linearGradient>` (using the given `id`) followed by a filled
 * rect; for a solid colour it emits just the rect.
 *
 * A background image has to be read before it can be drawn, which is the
 * renderer's job. Called without one, an image background is the colour behind
 * it, so a caller assembling an SVG by hand gets a plain image rather than a
 * reference to something that is not there.
 */
export function backgroundSvg(
  background: Background,
  dimensions: Dimensions,
  id: string,
  asset?: ImageAsset,
): string {
  const { width, height } = dimensions;

  if (background.type === "solid") {
    return `<rect width="${String(width)}" height="${String(height)}" fill="${background.color}"/>`;
  }

  if (background.type === "image") {
    return imageBackground(
      background,
      { x: 0, y: 0, width, height },
      id,
      asset,
    );
  }

  const from = background.from ?? { x: 0, y: 0 };
  const to = background.to ?? { x: 1, y: 1 };

  const stops = background.stops
    .map((stop) => `<stop offset="${stop.offset}" stop-color="${stop.color}"/>`)
    .join("");

  return (
    `<defs>` +
    `<linearGradient id="${id}" x1="${String(from.x)}" y1="${String(from.y)}"` +
    ` x2="${String(to.x)}" y2="${String(to.y)}">${stops}</linearGradient>` +
    `</defs>` +
    `<rect width="${String(width)}" height="${String(height)}" fill="url(#${id})"/>`
  );
}
