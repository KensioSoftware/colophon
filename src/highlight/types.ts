/**
 * One highlighted run of text on a line, positioned by character column so the
 * renderer can lay it out on a fixed monospace grid.
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
 * A tokenised snippet ready for layout: the grid of lines, the theme's own
 * colours, and its longest line in characters.
 */
export interface HighlightedCode {
  readonly lines: readonly (readonly CodeToken[])[];
  /** Theme foreground, used for tokens the grammar gives no colour. */
  readonly foreground: string;
  /** Theme background, used to fill the code panel. */
  readonly background: string;
  /** Length in characters of the longest line, for width fitting. */
  readonly longestLine: number;
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
