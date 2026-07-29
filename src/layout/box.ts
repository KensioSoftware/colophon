import type { BoxStyle, Rect } from "./types.js";

/** One SVG attribute, or nothing where the value was not given. */
function attribute(name: string, value: string | number | undefined): string {
  return value === undefined ? "" : ` ${name}="${String(value)}"`;
}

/**
 * A rectangle: the plate a badge sits on, the surface of a panel, a rule along
 * an edge. Everything in a template that is not text or an image is one of
 * these.
 *
 * Attributes a style does not name are left out rather than written as their
 * defaults, so the output says only what the template decided.
 */
export function box(rect: Rect, style: BoxStyle = {}): string {
  const attributes = [
    attribute("x", rect.x),
    attribute("y", rect.y),
    attribute("width", rect.width),
    attribute("height", rect.height),
    attribute("rx", style.radius),
    attribute("fill", style.fill),
    attribute("fill-opacity", style.fillOpacity),
    attribute("stroke", style.stroke),
    attribute("stroke-opacity", style.strokeOpacity),
    attribute("stroke-width", style.strokeWidth),
  ];

  return `<rect${attributes.join("")}/>`;
}

/**
 * Shrink a rectangle inwards, which is how a template gets its margins. One
 * number insets every edge; a partial one insets the edges it names.
 *
 * An inset larger than the rectangle collapses it to nothing rather than
 * turning it inside out, since a negative width draws nothing anyway and an
 * empty rectangle is easier to reason about than one with its corners crossed.
 */
export function inset(
  rect: Rect,
  amount: number | Partial<Record<"top" | "right" | "bottom" | "left", number>>,
): Rect {
  const all = typeof amount === "number" ? amount : 0;
  const edges = typeof amount === "number" ? {} : amount;
  const top = edges.top ?? all;
  const right = edges.right ?? all;
  const bottom = edges.bottom ?? all;
  const left = edges.left ?? all;

  return {
    x: rect.x + left,
    y: rect.y + top,
    width: Math.max(0, rect.width - left - right),
    height: Math.max(0, rect.height - top - bottom),
  };
}
