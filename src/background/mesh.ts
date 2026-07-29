import type { Background, Dimensions, MeshBlob } from "../types.js";

/** Radius of a blob that does not name one, as a fraction of the longer side. */
const defaultRadius = 0.7;

/**
 * One blob: a radial fade from its colour to nothing, and a rect filled with
 * it. A rect rather than a circle because the fade reaches the edge of the
 * image on at least one side of most blobs, and a circle would clip it there.
 *
 * The gradient is in user space rather than in bounding-box units, so the fade
 * stays circular. In bounding-box units it would take the proportions of the
 * rect it fills, which is the whole image, and a landscape image would stretch
 * every blob into an ellipse.
 */
function blobSvg(
  blob: MeshBlob,
  dimensions: Dimensions,
  id: string,
): { readonly def: string; readonly rect: string } {
  const { width, height } = dimensions;
  const radius = (blob.radius ?? defaultRadius) * Math.max(width, height);
  const opacity = blob.opacity ?? 1;

  const def =
    `<radialGradient id="${id}" gradientUnits="userSpaceOnUse"` +
    ` cx="${String((blob.x ?? 0.5) * width)}"` +
    ` cy="${String((blob.y ?? 0.5) * height)}" r="${String(radius)}">` +
    `<stop offset="0%" stop-color="${blob.color}" stop-opacity="${String(opacity)}"/>` +
    `<stop offset="100%" stop-color="${blob.color}" stop-opacity="0"/>` +
    `</radialGradient>`;

  return {
    def,
    rect: `<rect width="${String(width)}" height="${String(height)}" fill="url(#${id})"/>`,
  };
}

/**
 * Soft blobs of colour over a flat base, which is what a linear gradient
 * cannot do: colour that moves in more than one direction at once.
 *
 * Every blob covers the whole image and is mostly transparent, so they are
 * drawn in the order they were given and the later ones sit over the earlier.
 */
export function meshBackground(
  background: Extract<Background, { readonly type: "mesh" }>,
  dimensions: Dimensions,
  id: string,
): string {
  const { width, height } = dimensions;
  const blobs = background.blobs.map((blob, index) =>
    blobSvg(blob, dimensions, `${id}-blob-${String(index)}`),
  );

  return (
    `<defs>${blobs.map((blob) => blob.def).join("")}</defs>` +
    `<rect width="${String(width)}" height="${String(height)}" fill="${background.color}"/>${blobs
      .map((blob) => blob.rect)
      .join("")}`
  );
}
