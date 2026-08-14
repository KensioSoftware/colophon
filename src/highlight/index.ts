import { codeToTokens } from "shiki";

import { gridLine } from "./grid.js";
import { loadTheme, resolveLanguage } from "./language.js";
import { normaliseSnippet } from "./normalise.js";
import type { HighlightedCode, HighlightOptions } from "./types.js";

export { dedent, expandTabs } from "./normalise.js";
export { loadTheme, resolveLanguage, resolveTheme } from "./language.js";
export type { CodeToken, HighlightedCode, HighlightOptions } from "./types.js";

/**
 * Tokenise a snippet with Shiki and flatten it onto a character grid.
 *
 * The snippet is first normalised: surrounding blank lines trimmed, tabs
 * expanded, and common leading indentation removed.
 */
export async function highlightCode(
  code: string,
  options: HighlightOptions,
): Promise<HighlightedCode> {
  const result = await codeToTokens(normaliseSnippet(code, options.tabSize), {
    lang: resolveLanguage(options.language),
    theme: await loadTheme(options.theme),
  });

  return {
    lines: result.tokens.map((tokens) => gridLine(tokens)),
    foreground: result.fg ?? "#ffffff",
    background: result.bg ?? "#000000",
  };
}
