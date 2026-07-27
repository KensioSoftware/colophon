import {
  assertArrayLength,
  assertFalse,
  assertIdentical,
  assertStringIncludes,
  assertThrowsError,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import {
  dedent,
  expandTabs,
  highlightCode,
  resolveLanguage,
  resolveTheme,
} from "./highlight.js";

describe("resolveLanguage", () => {
  it("passes through names Shiki already knows", () => {
    assertIdentical(resolveLanguage("bash"), "bash");
    assertIdentical(resolveLanguage("TypeScript"), "typescript");
    assertIdentical(resolveLanguage(" yaml "), "yaml");
  });

  it("maps Pygments-style names onto Shiki equivalents", () => {
    assertIdentical(resolveLanguage("html+handlebars"), "handlebars");
    assertIdentical(resolveLanguage("console"), "shellsession");
  });

  it("falls back to plain text for unknown or empty names", () => {
    assertIdentical(resolveLanguage("text"), "plaintext");
    assertIdentical(resolveLanguage(""), "plaintext");
    assertIdentical(resolveLanguage("not-a-language"), "plaintext");
  });
});

describe("resolveTheme", () => {
  it("accepts a bundled theme", () => {
    assertIdentical(resolveTheme("github-dark"), "github-dark");
  });

  it("throws for an unknown theme rather than guessing", () => {
    const error = assertThrowsError(() => resolveTheme("nope-dark"));
    assertStringIncludes(error.message, 'Unknown code theme "nope-dark"');
  });
});

describe("expandTabs", () => {
  it("replaces tabs with the given number of spaces", () => {
    assertIdentical(expandTabs("a\tb", 4), "a    b");
    assertIdentical(expandTabs("\t\t", 2), " ".repeat(4));
  });

  it("treats a non-positive tab size as one space", () => {
    assertIdentical(expandTabs("a\tb", 0), "a b");
  });
});

describe("dedent", () => {
  it("removes the indentation common to every non-blank line", () => {
    assertIdentical(dedent("    a\n      b\n\n    c"), "a\n  b\n\nc");
  });

  it("leaves code that already starts at the left margin", () => {
    assertIdentical(dedent("a\n  b"), "a\n  b");
    assertIdentical(dedent(""), "");
  });

  it("ignores whitespace-only lines when measuring", () => {
    assertIdentical(dedent("  a\n   \n  b"), "a\n \nb");
  });
});

describe("highlightCode", () => {
  const options = { language: "bash", theme: "github-dark", tabSize: 2 };

  it("returns a token grid with theme colours", async () => {
    const result = await highlightCode("echo 'hi'\n", options);

    assertArrayLength(result.lines, 1);
    assertIdentical(result.background, "#24292e");
    assertIdentical(result.longestLine, 9);
    assertArrayLength(result.lines[0], 2);
    assertIdentical(result.lines[0][0].text, "echo");
    assertIdentical(result.lines[0][1].column, 5);
  }, 5000);

  it("drops whitespace-only runs but keeps their columns", async () => {
    const result = await highlightCode("if x:\n    return 1", {
      ...options,
      language: "python",
    });

    assertArrayLength(result.lines, 2);
    const indented = result.lines[1];
    assertArrayLength(indented, 2);
    assertFalse(indented[0].text.startsWith(" "));
    assertIdentical(indented[0].column, 4);
  }, 5000);

  it("trims surrounding blank lines and normalises line endings", async () => {
    const result = await highlightCode("\n\r\na\r\nb\n\n\n", options);
    assertArrayLength(result.lines, 2);
  }, 5000);
});
