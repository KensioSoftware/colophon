import {
  assertArrayLength,
  assertIdentical,
  assertStringIncludes,
  assertStringNotIncludes,
  assertTrue,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { resolveConfig } from "./config.js";
import {
  bannerTemplate,
  builtinTemplates,
  cardTemplate,
  codeTemplate,
} from "./templates/index.js";
import type {
  ColophonConfig,
  Dimensions,
  MetaImageProps,
  Template,
} from "./types.js";

const square: Dimensions = { width: 1200, height: 1200 };

async function render(
  template: Template,
  props: MetaImageProps,
  config: ColophonConfig = {},
  dimensions: Dimensions = square,
): Promise<string> {
  return template.render({ props, config: resolveConfig(config), dimensions });
}

describe("builtinTemplates", () => {
  it("registers banner, card and code by name", () => {
    assertIdentical(builtinTemplates["banner"], bannerTemplate);
    assertIdentical(builtinTemplates["card"], cardTemplate);
    assertIdentical(builtinTemplates["code"], codeTemplate);
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
});

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

  it("clips lines that overrun the panel at the minimum font size", async () => {
    const svg = await render(
      codeTemplate,
      {
        template: "code",
        code: `x = "${"y".repeat(400)}"`,
        language: "python",
      },
      // A high floor forces the fitted size up past what the width allows.
      { code: { minFontScale: 0.05 } },
    );

    const rightmost = Math.max(
      ...Array.from(svg.matchAll(/<tspan x="(\d+)"/g), (m) => Number(m[1])),
    );

    assertStringIncludes(svg, "\u{2026}</tspan>");
    assertTrue(rightmost < 1200);
  }, 5000);

  it("truncates code too long to fit legibly", async () => {
    const code = Array.from(
      { length: 400 },
      (_, i) => `line ${String(i)}`,
    ).join("\n");
    const svg = await render(codeTemplate, {
      template: "code",
      code,
      language: "text",
    });

    assertStringIncludes(svg, ">…</tspan>");
    assertTrue((svg.match(/<text /g) ?? []).length < 400);
  }, 5000);
});
