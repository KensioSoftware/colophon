import { escapeXml } from "../text/index.js";
import type { BoxStyle, Rect } from "./types.js";

/**
 * One SVG attribute, or nothing where the value was not given.
 *
 * The value is escaped even though most of them are colours out of a config,
 * where nothing needs escaping. A template's props come from frontmatter, and a
 * template is free to pass one straight through as a fill, so a site whose
 * posts are not all written by the same person would otherwise be one `"` away
 * from a document that does not parse.
 */
function attribute(name: string, value: string | number | undefined): string {
  return value === undefined ? "" : ` ${name}="${escapeXml(String(value))}"`;
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
    // Clamped so that a rectangle which collapses does so at the far edge of
    // the one it came from, rather than landing outside it with no width.
    x: rect.x + Math.min(left, rect.width),
    y: rect.y + Math.min(top, rect.height),
    width: Math.max(0, rect.width - left - right),
    height: Math.max(0, rect.height - top - bottom),
  };
}
