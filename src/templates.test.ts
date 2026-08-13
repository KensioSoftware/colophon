import {
  assertArrayLength,
  assertIdentical,
  assertNonNullable,
  assertNumberBetween,
  assertStringIncludes,
  assertStringNotIncludes,
  assertTrue,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import {
  baselineOf,
  renderTemplate as render,
  samplePng,
  sansFont,
  titleSize,
  wide,
} from "../test/template.js";
import {
  bannerTemplate,
  builtinTemplates,
  cardTemplate,
  codeTemplate,
} from "./templates/index.js";
import type { MetaImageProps } from "./types.js";

describe("builtinTemplates", () => {
  it("registers every built-in template by name", () => {
    assertIdentical(builtinTemplates["banner"], bannerTemplate);
    assertIdentical(builtinTemplates["card"], cardTemplate);
    assertIdentical(builtinTemplates["code"], codeTemplate);
    assertArrayLength(Object.keys(builtinTemplates), 13);
  });
});

describe("bannerTemplate", () => {
  it("renders title, version, subtitle, badge and footer", async () => {
    const svg = await render(
      bannerTemplate,
      {
        template: "banner",
        title: "hello world",
        subtitle: "a wrapped subtitle line here",
        version: "1.2.0",
      },
      { badge: { text: "npm" }, footer: "example.com" },
    );

    assertStringIncludes(svg, ">hello world</text>");
    assertStringIncludes(svg, ">v1.2.0</text>");
    assertStringIncludes(svg, ">example.com</text>");
    assertStringIncludes(svg, ">npm</text>");
    assertStringIncludes(svg, "<rect"); // badge box
    assertStringIncludes(svg, "a wrapped");
  });

  it("omits version, badge and footer when not configured", async () => {
    const svg = await render(bannerTemplate, {
      template: "banner",
      title: "just a title",
    });

    assertStringIncludes(svg, ">just a title</text>");
    assertStringNotIncludes(svg, "<rect");
    assertArrayLength(svg.match(/<text/g), 1);
  });

  it("draws a logo in the corner the badge is not in", async () => {
    const svg = await render(
      bannerTemplate,
      { template: "banner", title: "t" },
      { logo: { path: samplePng }, badge: { text: "npm" } },
    );

    // Against the right margin: 1200 - 90 padding - 171 wide.
    assertStringIncludes(svg, '<image x="939" y="90" width="171" height="90"');
  });

  it("coerces a numeric version and escapes the title", async () => {
    const svg = await render(bannerTemplate, {
      template: "banner",
      title: "a & b",
      version: 2,
    });

    assertStringIncludes(svg, ">a &amp; b</text>");
    assertStringIncludes(svg, ">v2</text>");
  });

  it("ignores an empty-string subtitle", async () => {
    const svg = await render(bannerTemplate, {
      template: "banner",
      title: "t",
      subtitle: "",
    });

    // No subtitle → larger, single title line and nothing else textual.
    assertArrayLength(svg.match(/<text/g), 1);
  });

  it("draws the badge a post declares over the configured one", async () => {
    const svg = await render(
      bannerTemplate,
      { template: "banner", title: "t", badge: { text: "video" } },
      { badge: { text: "npm" } },
    );

    assertStringIncludes(svg, ">video</text>");
    assertStringNotIncludes(svg, ">npm</text>");
  });

  it("takes the badge colours from the post as well", async () => {
    const svg = await render(bannerTemplate, {
      template: "banner",
      title: "t",
      badge: { text: "video", color: "#f9fafb", background: "#111827" },
    });

    assertStringIncludes(svg, 'fill="#111827"');
    assertStringIncludes(svg, 'fill="#f9fafb"');
  });

  it("draws no badge for a post declaring false", async () => {
    const props: MetaImageProps = {
      template: "banner",
      title: "a title long enough to be laid out",
    };
    const svg = await render(
      bannerTemplate,
      { ...props, badge: false },
      { badge: { text: "npm" } },
    );

    // The same image as a site with no badge at all: the plate is gone, and
    // the text has the room back that was reserved above it.
    assertIdentical(svg, await render(bannerTemplate, props));
  });

  it("keeps the configured badge and warns for a badge it cannot read", async () => {
    const warnings: string[] = [];
    // What a post holds is whatever its frontmatter said, which the props type
    // describes but cannot enforce.
    const props = {
      template: "banner",
      title: "t",
      badge: "video",
    } as unknown as MetaImageProps;
    const svg = await render(bannerTemplate, props, {
      badge: { text: "npm" },
      onWarning: (message) => {
        warnings.push(message);
      },
    });

    assertStringIncludes(svg, ">npm</text>");
    assertArrayLength(warnings, 1);
    assertStringIncludes(warnings[0], "props.badge");
  });

  it("warns for a badge object carrying no text to draw", async () => {
    const warnings: string[] = [];
    const props = {
      template: "banner",
      title: "t",
      badge: { txt: "video" },
    } as unknown as MetaImageProps;
    const svg = await render(bannerTemplate, props, {
      badge: { text: "npm" },
      onWarning: (message) => {
        warnings.push(message);
      },
    });

    assertStringIncludes(svg, ">npm</text>");
    assertArrayLength(warnings, 1);
  });
});

describe("cardTemplate", () => {
  it("centres the title and subtitle", async () => {
    const svg = await render(cardTemplate, {
      template: "card",
      title: "centered title",
      subtitle: "and a subtitle",
    });

    assertStringIncludes(svg, ">centered title</text>");
    assertStringIncludes(svg, ">and a subtitle</text>");
    assertStringIncludes(svg, 'text-anchor="middle"');
  });

  it("renders a footer when configured", async () => {
    const svg = await render(
      cardTemplate,
      { template: "card", title: "t" },
      { footer: "site.example" },
    );

    assertStringIncludes(svg, ">site.example</text>");
  });

  it("renders only the title when nothing else is given", async () => {
    const svg = await render(cardTemplate, { template: "card", title: "solo" });
    assertArrayLength(svg.match(/<text/g), 1);
  });

  it("draws the avatar alone when there is no footer to sit beside", async () => {
    const svg = await render(cardTemplate, {
      template: "card",
      title: "t",
      avatar: samplePng,
    });

    assertStringIncludes(svg, 'clip-path="url(#colophon-avatar)"');
    // Centred on its own rather than shifted left to make room for words. The
    // picture is sized from the footer's text, so this moves with it.
    assertStringIncludes(svg, '<image x="559"');
  });

  it("shrinks a long title instead of losing the end of it", async () => {
    const svg = await render(cardTemplate, {
      template: "card",
      title: "Generating share images from a post's own frontmatter",
    });

    // Four lines at the full 120px, three at 86px, so it shrinks and keeps
    // every word rather than stopping after "own".
    assertStringIncludes(svg, ">Generating share<");
    assertStringIncludes(svg, ">own frontmatter<");
    assertNumberBetween(titleSize(svg), 1, 119);
  });

  it("wraps a title written without spaces", async () => {
    // Japanese has no spaces to break at, and its characters are a whole em
    // wide rather than half of one, so the old estimate ran it off the image.
    const svg = await render(cardTemplate, {
      template: "card",
      title: "同じ入力から複数の寸法の画像を生成します",
    });

    assertArrayLength(svg.match(/<text/g), 3);
    assertStringIncludes(svg, ">を生成します<");
  });
});

/** Geometry of the code panel: the stroked surface rect, not its shadow. */
function panelRect(svg: string): { x: number; y: number; width: number } {
  const match = /<rect x="(\d+)" y="(\d+)" width="(\d+)"[^>]*stroke=/.exec(svg);
  assertNonNullable(match);

  return {
    x: Number(match[1]),
    y: Number(match[2]),
    width: Number(match[3]),
  };
}

/** Every x a token is drawn at, in image coordinates. */
function tspanColumns(svg: string): readonly number[] {
  return Array.from(svg.matchAll(/<tspan x="(\d+)"/g), (match) =>
    Number(match[1]),
  );
}

describe("codeTemplate", () => {
  const bash = "#!/usr/bin/env bash\n\necho 'hello'\n";

  it("renders a highlighted panel with one text element per non-blank line", async () => {
    const svg = await render(codeTemplate, {
      template: "code",
      code: bash,
      language: "bash",
    });

    // Shadow + panel surface, and a <text> for each of the two code lines.
    assertArrayLength(svg.match(/<rect/g), 2);
    assertArrayLength(svg.match(/<text /g), 2);
    assertStringIncludes(svg, 'xml:space="preserve"');
    assertStringIncludes(svg, ">echo</tspan>");
    assertStringIncludes(svg, ">&apos;hello&apos;</tspan>");
  }, 5000);

  it("colours tokens from the configured theme", async () => {
    const dark = await render(codeTemplate, {
      template: "code",
      code: "const x = 1;",
      language: "typescript",
    });
    const light = await render(
      codeTemplate,
      { template: "code", code: "const x = 1;", language: "typescript" },
      { code: { theme: "github-light" } },
    );

    assertStringNotIncludes(light, 'rx="30" fill="#24292e"');
    assertStringIncludes(dark, 'rx="30" fill="#24292e"');
  }, 5000);

  it("lays the grid out on the font's own advance", async () => {
    const props = {
      template: "code",
      code: "if x:\n    return 1",
      language: "python",
    };
    const assumed = await render(codeTemplate, props);
    const measured = await render(codeTemplate, props, {
      // A proportional face, which is not a configuration the template
      // supports: it draws on a character grid and wants a monospace font. It
      // is here because its digit advance of 0.636 em is far enough from the
      // 0.6 assumed for monospace to show up in the geometry.
      fonts: [{ family: "DejaVu Sans", path: sansFont }],
      code: { fontFamily: "DejaVu Sans" },
    });

    // Wider characters mean a wider block, and the panel hugs the block.
    assertTrue(panelRect(measured).width > panelRect(assumed).width);
  }, 5000);

  it("preserves indentation as absolute token columns", async () => {
    const svg = await render(codeTemplate, {
      template: "code",
      code: "if x:\n    return 1",
      language: "python",
    });

    const columns = Array.from(svg.matchAll(/<tspan x="(\d+)"/g), (match) =>
      Number(match[1]),
    );

    // The indented `return` starts to the right of the `if` on the line above.
    assertArrayLength(columns, 4);
    assertTrue(Math.max(...columns) > columns[0]);
  }, 5000);

  it("falls back to plain text for an unknown language", async () => {
    const svg = await render(codeTemplate, {
      template: "code",
      code: "no lexer for this",
      language: "not-a-real-language",
    });

    assertStringIncludes(svg, "no lexer for this");
  }, 5000);

  it("renders a title above the panel and the configured footer below", async () => {
    const svg = await render(
      codeTemplate,
      { template: "code", code: "ls -la", language: "bash", title: "Listing" },
      { footer: "example.com" },
    );

    assertStringIncludes(svg, ">Listing</text>");
    assertStringIncludes(svg, ">example.com</text>");
  }, 5000);

  it("clears the panel by the gap the layout reserved for the title", async () => {
    const svg = await render(codeTemplate, {
      template: "code",
      code: "ls -la",
      language: "bash",
      title: "Listing",
    });

    // `layoutPanel` sets 2.8% of the shorter side aside above the panel, and
    // the title's descender takes a fifth of its 54px size below the baseline.
    // Both have to come off, or the gap that is reserved is not the gap seen.
    assertIdentical(
      panelRect(svg).y - baselineOf(svg, /y="(\d+)"[^>]*>Listing</),
      34 + 11,
    );
  }, 5000);

  it("keeps the footer's descender inside the bottom margin", async () => {
    const svg = await render(
      codeTemplate,
      { template: "code", code: "ls -la", language: "bash" },
      { footer: "example.com" },
    );

    // The 5% margin is where the ink stops, so the 43px footer's baseline sits
    // its own descender above it.
    assertIdentical(
      baselineOf(svg, /y="(\d+)"[^>]*>example\.com</),
      1200 - 60 - 9,
    );
  }, 5000);

  it("clips lines that overrun the panel at the minimum font size", async () => {
    const warnings: string[] = [];
    const svg = await render(
      codeTemplate,
      {
        template: "code",
        code: `x = "${"y".repeat(400)}"`,
        language: "python",
      },
      // A high floor forces the fitted size up past what the width allows.
      {
        code: { minFontScale: 0.05 },
        onWarning: (m) => {
          warnings.push(m);
        },
      },
    );

    const rightmost = Math.max(...tspanColumns(svg));

    assertStringIncludes(svg, "\u{2026}</tspan>");
    assertTrue(rightmost < 1200);
    assertArrayLength(warnings, 1);
    assertStringIncludes(warnings[0], "1 line clipped to the panel width");
  }, 5000);

  it("truncates code too long to fit legibly, and says so", async () => {
    const warnings: string[] = [];
    const code = Array.from(
      { length: 400 },
      (_, i) => `line ${String(i)}`,
    ).join("\n");
    const svg = await render(
      codeTemplate,
      { template: "code", code, language: "text" },
      {
        onWarning: (m) => {
          warnings.push(m);
        },
      },
    );

    assertStringIncludes(svg, ">…</tspan>");
    assertTrue((svg.match(/<text /g) ?? []).length < 400);
    assertArrayLength(warnings, 1);
    assertStringIncludes(warnings[0], "the 1200x1200 image");
    assertStringIncludes(warnings[0], "of 400 lines dropped");
  }, 5000);

  it("says nothing when the whole snippet fits", async () => {
    const warnings: string[] = [];
    await render(
      codeTemplate,
      { template: "code", code: bash, language: "bash" },
      {
        onWarning: (m) => {
          warnings.push(m);
        },
      },
    );

    assertArrayLength(warnings, 0);
  }, 5000);

  it("dedents a snippet lifted out of a nested block", async () => {
    const svg = await render(codeTemplate, {
      template: "code",
      code: "      if x:\n          return 1",
      language: "python",
    });

    const { x } = panelRect(svg);
    const columns = tspanColumns(svg);

    // `if` sits at the panel's left margin, as though the snippet were written
    // there; `return` keeps its one relative level of indentation.
    assertNumberBetween(Math.min(...columns) - x, 1, 100);
    assertTrue(Math.max(...columns) > Math.min(...columns));
  }, 5000);

  it("left-aligns the code inside a panel hugged to it", async () => {
    const svg = await render(
      codeTemplate,
      {
        template: "code",
        code: "const wideEnoughToHugThePanel = true;\nlet x;",
        language: "typescript",
      },
      {},
      wide,
    );

    const { x, width } = panelRect(svg);
    const columns = tspanColumns(svg);
    const left = Math.min(...columns) - x;
    const right = x + width - Math.max(...columns);

    // Both unindented lines start at the same margin, and that margin is a
    // padding rather than the gutter a centred block would leave.
    assertArrayLength(
      columns.filter((column) => column === left + x),
      2,
    );
    assertNumberBetween(left, 1, width * 0.12);
    // The panel hugs the block, so the room left of the code matches the room
    // right of the longest line.
    assertNumberBetween(right - left, -2, left);
  }, 5000);

  it("keeps landscape code no smaller than the legibility floor", async () => {
    const code = Array.from(
      { length: 40 },
      (_, i) => `const line${String(i)} = ${String(i)};`,
    ).join("\n");
    const svg = await render(
      codeTemplate,
      { template: "code", code, language: "typescript" },
      {},
      wide,
    );

    // The floor is a fraction of the image width, not its height: a landscape
    // image drops lines rather than rendering them at half the square's size.
    const sizes = Array.from(svg.matchAll(/font-size="(\d+)"/g), (match) =>
      Number(match[1]),
    );

    assertStringIncludes(svg, ">…</tspan>");
    assertNumberBetween(Math.min(...sizes), wide.width * 0.025, 1200);
  }, 5000);
});
