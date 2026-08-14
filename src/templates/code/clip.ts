import type { CodeToken } from "../../highlight/index.js";
import { ellipsis } from "../../text/ellipsis.js";
import type { Advance } from "./advance.js";
import { placeTokens } from "./extent.js";
import { truncate } from "./truncate.js";

/**
 * Clip a line to the width that fits, ending it with an ellipsis. The font
 * size is floored for legibility, so a wide enough snippet can still overrun
 * the panel, and clipping keeps it inside instead of bleeding off the image.
 *
 * Returns the line unchanged when it already fits, so the caller can count the
 * clipped lines by identity.
 */
export function clipLine(
  tokens: readonly CodeToken[],
  maxWidth: number,
  advance: Advance,
): readonly CodeToken[] {
  const placed = placeTokens(tokens, advance);
  const last = placed.at(-1);

  if (last === undefined || last.x + advance(last.token.text) <= maxWidth) {
    return tokens;
  }

  const clipped: CodeToken[] = [];
  const mark = advance(ellipsis);

  for (const { token, x } of placed) {
    const room = maxWidth - x;

    // Not even room for the marker, so there is nothing worth drawing here:
    // whatever it were cut to would be the ellipsis on its own, overhanging
    // the width the rest of the line was held to.
    if (room < mark) {
      break;
    }

    if (advance(token.text) <= room) {
      clipped.push(token);
      continue;
    }

    clipped.push({ ...token, text: truncate(token.text, room, advance) });
    break;
  }

  return clipped;
}

/**
 * Clip every line to the panel width, and count how many had to give ground.
 */
export function clipLines(
  lines: readonly (readonly CodeToken[])[],
  maxWidth: number,
  advance: Advance,
): { lines: readonly (readonly CodeToken[])[]; clipped: number } {
  let clipped = 0;

  const fitted = lines.map((tokens) => {
    const line = clipLine(tokens, maxWidth, advance);

    if (line !== tokens) {
      clipped += 1;
    }

    return line;
  });

  return { lines: fitted, clipped };
}
