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
