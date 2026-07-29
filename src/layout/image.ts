import { escapeXml } from "../text/index.js";
import type { Rect } from "./types.js";

/** How an image fills the rectangle it was given. */
export interface ImageOptions {
  /**
   * `cover` fills the rectangle and crops whatever does not fit, which is what
   * a background photo wants. `contain` fits the whole image inside it, which
   * is what a logo wants, since cropping a wordmark ruins it.
   */
  readonly fit?: "cover" | "contain";
  readonly opacity?: number;
  /**
   * Rounded corners, for an avatar or a screenshot. Needs an `id` to hang the
   * clip path on, because SVG has no other way to say it.
   */
  readonly radius?: number;
  /** Unique within the image. Only read when `radius` is set. */
  readonly id?: string;
}

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

  if (options.radius === undefined || options.id === undefined) {
    return element;
  }

  return (
    `<defs><clipPath id="${options.id}">` +
    `<rect x="${String(rect.x)}" y="${String(rect.y)}"` +
    ` width="${String(rect.width)}" height="${String(rect.height)}"` +
    ` rx="${String(options.radius)}"/>` +
    `</clipPath></defs>` +
    `<g clip-path="url(#${options.id})">${element}</g>`
  );
}
