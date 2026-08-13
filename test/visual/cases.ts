/**
 * The images the visual regression check covers: the README gallery, plus a few
 * cases the gallery has no reason to include.
 *
 * The gallery is chosen to look good in a table, so between them its samples
 * exercise three templates, eight themes and two proportions, and none of them
 * exercise the arithmetic that is most likely to be got wrong: a title long
 * enough to wrap and then shrink, a snippet long enough to be truncated, and
 * the images drawn over and alongside a template's own text. Those are here.
 */
import { samples, type Sample } from "../samples.js";

/**
 * An inline SVG as an image source's bytes, which is what a mark usually is.
 * `size` is what the file declares itself to be, since that is where the
 * proportions are read from; the drawing is always on a 64-unit grid.
 */
function svg(body: string, size = 64): Uint8Array {
  return new TextEncoder().encode(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(size)}"` +
      ` height="${String(size)}" viewBox="0 0 64 64">${body}</svg>`,
  );
}

/** The same, as the `data:` URI an avatar prop takes. */
function svgUri(body: string): string {
  const text = new TextDecoder().decode(svg(body));

  return `data:image/svg+xml,${encodeURIComponent(text)}`;
}

const ring = svg(
  '<circle cx="32" cy="32" r="26" fill="none" stroke="#ffffff"' +
    ' stroke-width="7" /><circle cx="32" cy="32" r="8" fill="#ffffff" />',
);

const face = svgUri(
  '<rect width="64" height="64" fill="#fbbf24" />' +
    '<circle cx="32" cy="26" r="11" fill="#78350f" />' +
    '<path d="M8 64a24 24 0 0 1 48 0z" fill="#78350f" />',
);

/**
 * A stand-in for a photograph: shapes rather than a raster, so there is no
 * image file to commit next to the baselines.
 */
const scene = svg(
  '<rect width="64" height="64" fill="#1e3a8a" />' +
    '<circle cx="46" cy="14" r="9" fill="#fef9c3" />' +
    '<path d="M0 44l18-16 14 12 12-9 20 17v16H0z" fill="#065f46" />',
  512,
);

const regressions: readonly Sample[] = [
  {
    // A title too long for one line at its starting size, so it wraps, and
    // still too long once wrapped, so it shrinks. Both are `fitText`.
    name: "fit-long-title",
    dimensions: { width: 1200, height: 1200 },
    props: {
      template: "card",
      title: "A headline long enough to wrap and shrink",
      subtitle:
        "And a subtitle underneath it that also runs past the width of the " +
        "image, so the two groups have to share the middle",
    },
    config: { colors: { brand: "#7c3aed" }, footer: "example.com" },
  },
  {
    // Wider and longer than the panel can hold at the minimum font size, so
    // the `code` template truncates and hugs what is left.
    name: "code-truncated",
    dimensions: { width: 1200, height: 630 },
    props: {
      template: "code",
      title: "A snippet that does not fit",
      language: "typescript",
      code: Array.from(
        { length: 14 },
        (_unused, line) =>
          `export const option${String(line)} = readOption(config, "size", {` +
          ` required: true, fallback: "none", warn: onWarning });`,
      ).join("\n"),
    },
    config: { colors: { brand: "#0f766e" } },
  },
  {
    // A logo in one corner, a badge in the other and an avatar on the footer:
    // everything `loadImages` gathers, drawn at once.
    name: "branded",
    dimensions: { width: 1200, height: 1200 },
    props: {
      template: "banner",
      title: "Branded to the corners",
      subtitle: "A logo, a badge and an author photograph",
      version: "3.1.4",
      avatar: face,
    },
    config: {
      colors: { brand: "#b91c1c", brandDark: "#7f1d1d" },
      logo: { data: ring },
      badge: { text: "v3" },
      footer: "example.com",
    },
  },
  {
    // A tagline tracked out to the width of the name above it, which is the
    // one thing on any image whose correctness is a measurement rather than a
    // look: the two lines have to share both edges.
    name: "cover-tracked",
    dimensions: { width: 1200, height: 400 },
    props: {
      template: "cover",
      title: "Kensio Software",
      subtitle: "kensiosoftware.co.uk",
      tracking: "fill",
    },
    config: {
      colors: { brand: "#6a4c9c", brandDark: "#533b7a", brandWarm: "#9b6969" },
      safeArea: { top: 0.12, right: 0.06, bottom: 0.12, left: 0.25 },
    },
  },
  {
    // Text over a picture, which is only readable because of the scrim.
    name: "photo-scrim",
    dimensions: { width: 1200, height: 630 },
    props: {
      template: "card",
      title: "Over a photograph",
      subtitle: "The scrim is what makes this legible",
    },
    config: {
      background: { type: "image", source: { data: scene }, fit: "cover" },
      footer: "example.com",
    },
  },
];

/** Every sample the baselines cover. */
export const visualSamples: readonly Sample[] = [...samples, ...regressions];
