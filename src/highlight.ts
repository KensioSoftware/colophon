import type { BundledLanguage, BundledTheme, SpecialLanguage } from "shiki";
import { bundledLanguages, bundledThemes, codeToTokens } from "shiki";

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
 * Options for {@link highlightCode}.
 */
export interface HighlightOptions {
  /** Language name; unknown names fall back to plain text. */
  readonly language: string;
  /** Shiki theme name. */
  readonly theme: string;
  /** Spaces a tab expands to. */
  readonly tabSize: number;
}

/**
 * Language names that differ between Pygments (which the original Python
 * script used) and Shiki. Everything else is passed through — Shiki already
 * understands `bash`, `python`, `typescript`, `yaml`, `toml`, `sql`, `json`,
 * `js` and `text`.
 */
const languageAliases: ReadonlyMap<string, string> = new Map([
  ["html+handlebars", "handlebars"],
  ["html+django", "jinja-html"],
  ["html+jinja", "jinja-html"],
  ["html+php", "php"],
  ["console", "shellsession"],
  ["shell-session", "shellsession"],
  ["text", "plaintext"],
  ["plain", "plaintext"],
]);

const plainText: SpecialLanguage = "plaintext";

// Shiki's font-style bit flags (`FontStyle` in `@shikijs/types`).
const italicFlag = 1;
const boldFlag = 2;

/**
 * Map a frontmatter language name onto one Shiki understands, falling back to
 * plain text so an unrecognised language still produces a readable image
 * rather than throwing mid-build.
 */
export function resolveLanguage(
  language: string,
): BundledLanguage | SpecialLanguage {
  const normalised = language.trim().toLowerCase();
  const aliased = languageAliases.get(normalised) ?? normalised;

  return Object.hasOwn(bundledLanguages, aliased)
    ? (aliased as BundledLanguage)
    : plainText;
}

/**
 * Validate a configured theme name. Unlike languages — which come from post
 * frontmatter and fall back quietly — a bad theme is a config mistake worth
 * failing on.
 */
export function resolveTheme(theme: string): BundledTheme {
  if (!Object.hasOwn(bundledThemes, theme)) {
    throw new Error(
      `Unknown code theme "${theme}". See https://shiki.style/themes for the available names.`,
    );
  }

  return theme as BundledTheme;
}

/**
 * Expand tabs to spaces so every character occupies one monospace cell.
 */
export function expandTabs(text: string, tabSize: number): string {
  const spaces = " ".repeat(Math.max(1, Math.floor(tabSize)));
  return text.replaceAll("\t", () => spaces);
}

/**
 * Split an `#rrggbb` or `#rrggbbaa` colour into a fill and an optional opacity,
 * since SVG 1.1 `fill` does not accept an alpha channel.
 */
function splitColor(color: string | undefined): {
  color: string | undefined;
  opacity: number | undefined;
} {
  if (color === undefined || color === "") {
    return { color: undefined, opacity: undefined };
  }

  if (!/^#[0-9a-f]{8}$/i.test(color)) {
    return { color, opacity: undefined };
  }

  const alpha = Number.parseInt(color.slice(7, 9), 16) / 255;
  return { color: color.slice(0, 7), opacity: Math.round(alpha * 100) / 100 };
}

/**
 * Tokenise a snippet with Shiki and flatten it onto a character grid.
 *
 * Whitespace-only runs are dropped and each remaining run keeps its starting
 * column, so the renderer can position every run absolutely instead of relying
 * on SVG text flow to preserve indentation.
 */
export async function highlightCode(
  code: string,
  options: HighlightOptions,
): Promise<HighlightedCode> {
  const source = expandTabs(code.replaceAll("\r\n", "\n"), options.tabSize)
    .replace(/\n+$/, "")
    .replace(/^\n+/, "");

  const result = await codeToTokens(source, {
    lang: resolveLanguage(options.language),
    theme: resolveTheme(options.theme),
  });

  let longestLine = 0;

  const lines = result.tokens.map((tokens) => {
    let column = 0;
    const line: CodeToken[] = [];

    for (const token of tokens) {
      const start = column;
      column += token.content.length;

      const leading = token.content.length - token.content.trimStart().length;
      const text = token.content.trim();

      if (text === "") {
        continue;
      }

      const { color, opacity } = splitColor(token.color);
      const fontStyle = token.fontStyle ?? 0;

      line.push({
        text,
        column: start + leading,
        color,
        opacity,
        bold: (fontStyle & boldFlag) !== 0,
        italic: (fontStyle & italicFlag) !== 0,
      });
    }

    longestLine = Math.max(longestLine, column);
    return line;
  });

  return {
    lines,
    foreground: result.fg ?? "#ffffff",
    background: result.bg ?? "#000000",
    longestLine,
  };
}
