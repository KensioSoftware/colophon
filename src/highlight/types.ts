/**
 * One highlighted run of text on a line, carrying the character column it
 * starts at so the renderer can position it absolutely.
 */
export interface CodeToken {
  readonly text: string;
  /** Zero-based character column where this run starts. */
  readonly column: number;
  /** Token colour as `#rrggbb`, or `undefined` to use the theme foreground. */
  readonly color: string | undefined;
  /** Opacity implied by an `#rrggbbaa` token colour, if any. */
  readonly opacity: number | undefined;
  readonly bold: boolean;
  readonly italic: boolean;
}

/**
 * A tokenised snippet ready for layout: the lines, and the theme's own
 * colours.
 *
 * There is no width here, and there was: the longest line in characters. How
 * wide a line is depends on the face it is drawn in, since an ideograph takes
 * a full em where a Latin letter takes a fraction of one, so the width is
 * measured where the font is known rather than counted here where it is not.
 */
export interface HighlightedCode {
  readonly lines: readonly (readonly CodeToken[])[];
  /** Theme foreground, used for tokens the grammar gives no colour. */
  readonly foreground: string;
  /** Theme background, used to fill the code panel. */
  readonly background: string;
}

/**
 * Options for `highlightCode`.
 */
export interface HighlightOptions {
  /** Language name; unknown names fall back to plain text. */
  readonly language: string;
  /** Shiki theme name. */
  readonly theme: string;
  /** Spaces a tab expands to. */
  readonly tabSize: number;
}
