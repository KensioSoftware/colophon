import type { Extent } from "./size.js";

/**
 * The attributes of the root `<svg>` element that say how big it is. Written
 * out rather than built from a name, since there are three of them and a
 * pattern assembled from a string is harder to read than the three patterns.
 */
const attributes = {
  width: /\swidth\s*=\s*"([^"]*)"/i,
  height: /\sheight\s*=\s*"([^"]*)"/i,
  viewBox: /\sviewBox\s*=\s*"([^"]*)"/i,
} as const;

/** The value of one of them, where the root element carries it. */
function attribute(
  head: string,
  name: keyof typeof attributes,
): string | undefined {
  return attributes[name].exec(head)?.[1];
}

/**
 * A length such as `120`, `120px` or `7.5em`, as far as its number goes.
 *
 * A percentage is not one of them. `width="100%"` is the commonest way an
 * export states that it scales to its container, and reading it as 100 units
 * would make every such file square whatever its `viewBox` says.
 */
function length(value: string | undefined): number | undefined {
  if (value?.trim().endsWith("%") === true) {
    return undefined;
  }

  // Deliberately parseFloat rather than Number: a length may carry a unit,
  // and `6em` is six of something rather than not a number.
  // eslint-disable-next-line unicorn/prefer-number-coercion
  const number = Number.parseFloat(value ?? "");
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

/**
 * The proportions of an SVG, which are what a template needs: an SVG has no
 * pixels of its own, so only the ratio between its width and height means
 * anything here.
 *
 * `width` and `height` are read first and `viewBox` second, which is the order
 * a renderer resolves them in. A document with neither is left unmeasured
 * rather than assumed to be square, since a wordmark usually has neither.
 */
export function svgExtent(bytes: Uint8Array): Extent | undefined {
  const head = new TextDecoder().decode(bytes.slice(0, 4096));
  const root = /<svg[\s>][^>]*/i.exec(head)?.[0] ?? "";

  const width = length(attribute(root, "width"));
  const height = length(attribute(root, "height"));

  if (width !== undefined && height !== undefined) {
    return { width, height };
  }

  const box = attribute(root, "viewBox")
    ?.trim()
    .split(/[\s,]+/);

  if (box?.length !== 4) {
    return undefined;
  }

  const boxWidth = length(box[2]);
  const boxHeight = length(box[3]);

  return boxWidth === undefined || boxHeight === undefined
    ? undefined
    : { width: boxWidth, height: boxHeight };
}
