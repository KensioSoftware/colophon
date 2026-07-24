/**
 * Escape a string for safe inclusion in SVG/XML text content or attributes.
 */
export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/**
 * Naive greedy word-wrap by character count. Words longer than the limit are
 * kept intact on their own line rather than being split.
 */
export function wrapText(text: string, charactersPerLine: number): string[] {
  const limit = Math.max(1, Math.floor(charactersPerLine));
  const words = text.split(/\s+/).filter((word) => word !== "");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine === "" ? word : `${currentLine} ${word}`;

    if (nextLine.length > limit && currentLine !== "") {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine !== "") {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Estimate how many characters of the given font size fit within `widthPx`.
 * The `widthFactor` approximates average glyph width as a fraction of the font
 * size (bolder/wider faces want a larger factor).
 */
export function estimateCharsPerLine(
  widthPx: number,
  fontSize: number,
  widthFactor = 0.58,
): number {
  return Math.max(1, Math.floor(widthPx / (fontSize * widthFactor)));
}

/**
 * A single line to place in a vertical stack.
 */
export interface StackLine {
  readonly fontSize: number;
  /** Multiplier applied to `fontSize` for this line's total advance. */
  readonly lineHeight?: number;
  /** Extra space, in pixels, inserted before this line. Defaults to `0`. */
  readonly gapBefore?: number;
}

/**
 * A stack line with its computed text baseline `y` coordinate.
 */
export interface PlacedLine {
  readonly y: number;
  readonly index: number;
}

/**
 * Vertically centre a stack of lines within `[top, bottom]` and return the
 * text baseline for each. The block is centred as a whole; if it is taller
 * than the available area it simply starts at `top`.
 */
export function layoutStack(
  lines: readonly StackLine[],
  top: number,
  bottom: number,
): PlacedLine[] {
  const advances = lines.map(
    (line) => (line.gapBefore ?? 0) + line.fontSize * (line.lineHeight ?? 1.2),
  );
  const total = advances.reduce((sum, advance) => sum + advance, 0);

  let cursor = top + Math.max(0, (bottom - top - total) / 2);

  return lines.map((line, index) => {
    // Approximate the ascent as 80% of the font size to sit the baseline
    // sensibly within each line's advance box, after any leading gap.
    const baseline = cursor + (line.gapBefore ?? 0) + line.fontSize * 0.8;
    cursor += advances[index] ?? 0;
    return { y: Math.round(baseline), index };
  });
}

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
