import type { TextLine } from "../../layout/index.js";
import { blockLines, optionalString } from "../../layout/index.js";
import type { MeasureText, MetaImageProps } from "../../types.js";

const maxQuoteLines = 4;
const quoteFloor = 0.55;

/** The space the quotation has, and how to measure it into it. */
export interface QuoteText {
  readonly measure: MeasureText;
  readonly fontFamily: string;
  readonly contentWidth: number;
  readonly quoteFs: number;
}

/**
 * The quotation itself, read from `quote` or from `title`.
 *
 * Both names are taken because a post that is about one sentence usually has
 * that sentence in its title already, and making it write the same words twice
 * to get an image of them would be a poor trade for a tidier prop list.
 */
export function quoteLines(props: MetaImageProps, text: QuoteText): TextLine[] {
  const quote = optionalString(props["quote"]) ?? props.title;

  return blockLines(quote, text.measure, text.fontFamily, {
    maxWidth: text.contentWidth,
    maxLines: maxQuoteLines,
    fontSize: text.quoteFs,
    floor: quoteFloor,
    fontWeight: 700,
    opacity: 1,
  });
}

/**
 * Who said it: the name, then whatever the post added about them, after an em
 * dash. The dash is what makes the line read as an attribution rather than as
 * another line of the quotation.
 */
export function attributionText(props: MetaImageProps): string {
  const name = optionalString(props["author"]) ?? "";
  const role = optionalString(props["role"]) ?? "";

  if (name === "") {
    return role === "" ? "" : role;
  }

  return role === "" ? `— ${name}` : `— ${name}, ${role}`;
}
