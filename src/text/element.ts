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
  /**
   * Extra space between characters. Left out when it is zero, which is what
   * keeps every line that wanted none byte for byte what it was.
   */
  readonly letterSpacing?: number;
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
  const spacing =
    attributes.letterSpacing === undefined || attributes.letterSpacing === 0
      ? ""
      : ` letter-spacing="${String(attributes.letterSpacing)}"`;

  return (
    `<text x="${String(attributes.x)}" y="${String(attributes.y)}"` +
    ` font-family="${escapeXml(attributes.fontFamily)}"` +
    ` font-size="${String(attributes.fontSize)}"` +
    ` font-weight="${String(attributes.fontWeight)}"` +
    ` fill="${attributes.fill}"${opacity}${anchor}${spacing}>` +
    `${escapeXml(content)}</text>`
  );
}
