import { escapeXml } from "./escape.js";

/**
 * Attributes accepted by {@link textElement}. Colour and opacity are optional.
 */
export interface TextAttributes {
  readonly x: number;
  readonly y: number;
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fontWeight: number;
  readonly fill: string;
  readonly fillOpacity?: number;
  readonly anchor?: "start" | "middle" | "end";
}

/**
 * Build a single `<text>` element. The content is XML-escaped.
 */
export function textElement(
  content: string,
  attributes: TextAttributes,
): string {
  const opacity =
    attributes.fillOpacity === undefined
      ? ""
      : ` fill-opacity="${String(attributes.fillOpacity)}"`;
  const anchor =
    attributes.anchor === undefined
      ? ""
      : ` text-anchor="${attributes.anchor}"`;

  return (
    `<text x="${String(attributes.x)}" y="${String(attributes.y)}"` +
    ` font-family="${escapeXml(attributes.fontFamily)}"` +
    ` font-size="${String(attributes.fontSize)}"` +
    ` font-weight="${String(attributes.fontWeight)}"` +
    ` fill="${attributes.fill}"${opacity}${anchor}>` +
    `${escapeXml(content)}</text>`
  );
}
