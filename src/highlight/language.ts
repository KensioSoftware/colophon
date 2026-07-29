import type { BundledLanguage, BundledTheme, SpecialLanguage } from "shiki";
import { bundledLanguages, bundledThemes } from "shiki";

/**
 * Language names that differ between Pygments (which the original Python
 * script used) and Shiki. Everything else is passed through, since Shiki
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
 * Validate a configured theme name. Languages come from post frontmatter and
 * fall back quietly, but a bad theme is a config mistake worth failing on.
 */
export function resolveTheme(theme: string): BundledTheme {
  if (!Object.hasOwn(bundledThemes, theme)) {
    throw new Error(
      `Unknown code theme "${theme}". See https://shiki.style/themes for the available names.`,
    );
  }

  return theme as BundledTheme;
}
