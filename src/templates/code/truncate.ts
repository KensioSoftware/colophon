import { ellipsis } from "../../text/ellipsis.js";
import type { Advance } from "./advance.js";

/**
 * The longest run of `text` that leaves room for an ellipsis after it, with
 * the ellipsis on the end.
 *
 * It goes character by character rather than slicing at a count, because how
 * many characters fit is a question about the face rather than about the
 * string: a line of ideographs runs out of room in half the characters a line
 * of Latin does. Iterating the string also keeps a surrogate pair together,
 * which slicing at an index did not.
 */
export function truncate(text: string, room: number, advance: Advance): string {
  const mark = advance(ellipsis);
  let kept = "";

  for (const character of text) {
    if (advance(kept + character) + mark > room) {
      break;
    }

    kept += character;
  }

  return kept + ellipsis;
}
