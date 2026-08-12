import { optionalString } from "../../../props.js";
import type { ResolvedConfig } from "../../../types.js";

/**
 * One thing a post asked to have marked on its snippet.
 *
 * `text` names it by what it says, which is what frontmatter usually wants: it
 * survives the snippet being edited above the line, and it is what somebody
 * would type. `line` and `column` name it by where it is, for the times the
 * same text appears twice or the thing worth marking is a whole line.
 */
export interface CodeMark {
  readonly text?: string;
  /** One-based, as an editor counts. */
  readonly line?: number;
  /** One-based. Omit it, with no `text`, to mark the whole line. */
  readonly column?: number;
  /** Characters from `column`. Defaults to what `text` is, or the line. */
  readonly length?: number;
  /** Defaults to the palette's warm accent. */
  readonly color?: string;
}

function number(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

/** One declared mark, read field by field the way a badge is. */
function markFromProps(declared: object): CodeMark | undefined {
  const read = (key: string): unknown =>
    key in declared ? (declared as Record<string, unknown>)[key] : undefined;

  const text = optionalString(read("text"));
  const line = number(read("line"));

  if ((text === undefined || text === "") && line === undefined) {
    return undefined;
  }

  const column = number(read("column"));
  const length = number(read("length"));
  const color = optionalString(read("color"));

  return {
    ...(text !== undefined && text !== "" && { text }),
    ...(line !== undefined && { line }),
    ...(column !== undefined && { column }),
    ...(length !== undefined && { length }),
    ...(color !== undefined && { color }),
  };
}

/** A string is the text to find, and an object is read for its fields. */
function markFromValue(declared: unknown): CodeMark | undefined {
  const text = optionalString(declared);

  if (text !== undefined) {
    return text === "" ? undefined : { text };
  }

  return typeof declared === "object" && declared !== null
    ? markFromProps(declared)
    : undefined;
}

/**
 * The marks a post declared: one, or a list of them.
 *
 * Anything that is neither a string nor an object saying where to look is a
 * mistake in the frontmatter, and it is reported rather than dropped. A mark
 * that goes missing is invisible in the finished image, so nothing else would
 * ever say the post asked for one.
 */
export function readMarks(
  declared: unknown,
  config: ResolvedConfig,
): readonly CodeMark[] {
  if (declared === undefined) {
    return [];
  }

  const values = Array.isArray(declared) ? declared : [declared];
  const marks: CodeMark[] = [];

  for (const value of values) {
    const mark = markFromValue(value);

    if (mark === undefined) {
      config.onWarning(
        `code mark ${JSON.stringify(value)} says nothing to mark:` +
          ` give it text to find, or a line to draw across.`,
      );
      continue;
    }

    marks.push(mark);
  }

  return marks;
}
