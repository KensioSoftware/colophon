import { escapeXml } from "../text/index.js";
import type { Rect } from "./types.js";

/** How an image fills the rectangle it was given. */
interface ImageFit {
  /**
   * `cover` fills the rectangle and crops whatever does not fit, which is what
   * a background photo wants. `contain` fits the whole image inside it, which
   * is what a logo wants, since cropping a wordmark ruins it.
   */
  readonly fit?: "cover" | "contain";
  readonly opacity?: number;
}

/**
 * Rounded corners, for an avatar or a screenshot, which need a clip path and
 * so an id to hang it on: SVG has no other way to say it.
 *
 * The two travel together in the type, so a radius without an id does not
 * compile. It is the sort of option that would otherwise be dropped in silence,
 * and a template author asking for a round avatar and getting a square one has
 * nothing to go on.
 */
type ImageCorners =
  | { readonly radius?: undefined; readonly id?: string }
  | { readonly radius: number; readonly id: string };

/** Options for {@link image}. */
export type ImageOptions = ImageFit & ImageCorners;

/**
 * Draw an image within a rectangle.
 *
 * `href` is passed through as given, so it can be a `data:` URI, which is the
 * form that travels: an image file read at build time and inlined is an image
 * that renders the same wherever the build runs, with nothing to fetch.
 *
 * An `<image>` establishes its own viewport, so `cover` crops to the rectangle
 * without a clip path. Rounded corners do need one.
 */
export function image(
  rect: Rect,
  href: string,
  options: ImageOptions = {},
): string {
  const fit = (options.fit ?? "cover") === "cover" ? "slice" : "meet";
  const aspect = `xMidYMid ${fit}`;
  const opacity =
    options.opacity === undefined
      ? ""
      : ` opacity="${String(options.opacity)}"`;

  const element =
    `<image x="${String(rect.x)}" y="${String(rect.y)}"` +
    ` width="${String(rect.width)}" height="${String(rect.height)}"` +
    ` preserveAspectRatio="${aspect}"${opacity}` +
    ` href="${escapeXml(href)}"/>`;

  if (options.radius === undefined) {
    return element;
  }

  // The type pairs the two, so an id is here whenever a radius is.
  const id = escapeXml(options.id);

  return (
    `<defs><clipPath id="${id}">` +
    `<rect x="${String(rect.x)}" y="${String(rect.y)}"` +
    ` width="${String(rect.width)}" height="${String(rect.height)}"` +
    ` rx="${String(options.radius)}"/>` +
    `</clipPath></defs>` +
    `<g clip-path="url(#${id})">${element}</g>`
  );
}
