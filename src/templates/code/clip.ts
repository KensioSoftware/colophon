import type { CodeToken } from "../../highlight/index.js";
import { ellipsis } from "./ellipsis.js";

/**
 * Clip a line to the columns that fit, ending it with an ellipsis. The font
 * size is floored for legibility, so a wide enough snippet can still overrun
 * the panel — clipping keeps it inside instead of bleeding off the image.
 *
 * Returns the line unchanged when it already fits, so the caller can count the
 * clipped lines by identity.
 */
export function clipLine(
  tokens: readonly CodeToken[],
  maxColumns: number,
): readonly CodeToken[] {
  const last = tokens.at(-1);

  if (last === undefined || last.column + last.text.length <= maxColumns) {
    return tokens;
  }

  const clipped: CodeToken[] = [];

  for (const token of tokens) {
    if (token.column >= maxColumns) {
      break;
    }

    const room = maxColumns - token.column;

    if (token.text.length <= room) {
      clipped.push(token);
      continue;
    }

    clipped.push({ ...token, text: token.text.slice(0, room - 1) + ellipsis });
    break;
  }

  return clipped;
}

/**
 * Clip every line to the panel width, and count how many had to give ground.
 */
export function clipLines(
  lines: readonly (readonly CodeToken[])[],
  maxColumns: number,
): { lines: readonly (readonly CodeToken[])[]; clipped: number } {
  let clipped = 0;

  const fitted = lines.map((tokens) => {
    const line = clipLine(tokens, maxColumns);

    if (line !== tokens) {
      clipped += 1;
    }

    return line;
  });

  return { lines: fitted, clipped };
}
