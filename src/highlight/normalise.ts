/**
 * Expand tabs to spaces so every character occupies one monospace cell.
 */
export function expandTabs(text: string, tabSize: number): string {
  const spaces = " ".repeat(Math.max(1, Math.floor(tabSize)));
  return text.replaceAll("\t", () => spaces);
}

/**
 * Strip the indentation common to every non-blank line. A snippet lifted out
 * of a nested block would otherwise spend its width, the scarce dimension on
 * the landscape sizes, on indentation that carries no meaning once the
 * surrounding code is gone.
 */
export function dedent(text: string): string {
  const lines = text.split("\n");
  let common = Infinity;

  for (const line of lines) {
    if (line.trim() === "") {
      continue;
    }

    common = Math.min(common, line.length - line.trimStart().length);
  }

  if (common === 0 || !Number.isFinite(common)) {
    return text;
  }

  return lines.map((line) => line.slice(common)).join("\n");
}

/**
 * Normalise a snippet for layout: line endings unified, surrounding blank
 * lines trimmed, tabs expanded and common leading indentation removed.
 */
export function normaliseSnippet(code: string, tabSize: number): string {
  return dedent(
    expandTabs(code.replaceAll("\r\n", "\n"), tabSize)
      .replace(/\n+$/, "")
      .replace(/^\n+/, ""),
  );
}
