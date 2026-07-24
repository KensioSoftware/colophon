import { describe, expect, it } from "vitest";

import { resolveConfig } from "./config.js";
import {
  bannerTemplate,
  builtinTemplates,
  cardTemplate,
} from "./templates/index.js";
import type { ColophonConfig, Dimensions, MetaImageProps } from "./types.js";

const square: Dimensions = { width: 1200, height: 1200 };

function render(
  template: typeof bannerTemplate,
  props: MetaImageProps,
  config: ColophonConfig = {},
  dimensions: Dimensions = square,
): string {
  return template.render({ props, config: resolveConfig(config), dimensions });
}

describe("builtinTemplates", () => {
  it("registers banner and card by name", () => {
    expect(builtinTemplates["banner"]).toBe(bannerTemplate);
    expect(builtinTemplates["card"]).toBe(cardTemplate);
  });
});

describe("bannerTemplate", () => {
  it("renders title, version, subtitle, badge and footer", () => {
    const svg = render(
      bannerTemplate,
      {
        template: "banner",
        title: "hello world",
        subtitle: "a wrapped subtitle line here",
        version: "1.2.0",
      },
      { badge: { text: "npm" }, footer: "example.com" },
    );

    expect(svg).toContain(">hello world</text>");
    expect(svg).toContain(">v1.2.0</text>");
    expect(svg).toContain(">example.com</text>");
    expect(svg).toContain(">npm</text>");
    expect(svg).toContain("<rect"); // badge box
    expect(svg).toContain("a wrapped");
  });

  it("omits version, badge and footer when not configured", () => {
    const svg = render(bannerTemplate, {
      template: "banner",
      title: "just a title",
    });

    expect(svg).toContain(">just a title</text>");
    expect(svg).not.toContain("<rect");
    expect(svg.match(/<text/g)).toHaveLength(1);
  });

  it("coerces a numeric version and escapes the title", () => {
    const svg = render(bannerTemplate, {
      template: "banner",
      title: "a & b",
      version: 2,
    });

    expect(svg).toContain(">a &amp; b</text>");
    expect(svg).toContain(">v2</text>");
  });

  it("ignores an empty-string subtitle", () => {
    const svg = render(bannerTemplate, {
      template: "banner",
      title: "t",
      subtitle: "",
    });

    // No subtitle → larger, single title line and nothing else textual.
    expect(svg.match(/<text/g)).toHaveLength(1);
  });
});

describe("cardTemplate", () => {
  it("centres the title and subtitle", () => {
    const svg = render(cardTemplate, {
      template: "card",
      title: "centered title",
      subtitle: "and a subtitle",
    });

    expect(svg).toContain(">centered title</text>");
    expect(svg).toContain(">and a subtitle</text>");
    expect(svg).toContain('text-anchor="middle"');
  });

  it("renders a footer when configured", () => {
    const svg = render(
      cardTemplate,
      { template: "card", title: "t" },
      { footer: "site.example" },
    );

    expect(svg).toContain(">site.example</text>");
  });

  it("renders only the title when nothing else is given", () => {
    const svg = render(cardTemplate, { template: "card", title: "solo" });
    expect(svg.match(/<text/g)).toHaveLength(1);
  });
});
