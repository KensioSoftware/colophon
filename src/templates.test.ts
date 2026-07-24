import {
  assertArrayLength,
  assertIdentical,
  assertStringIncludes,
  assertStringNotIncludes,
} from "@kensio/smartass";
import { describe, it } from "vitest";

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
    assertIdentical(builtinTemplates["banner"], bannerTemplate);
    assertIdentical(builtinTemplates["card"], cardTemplate);
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

    assertStringIncludes(svg, ">hello world</text>");
    assertStringIncludes(svg, ">v1.2.0</text>");
    assertStringIncludes(svg, ">example.com</text>");
    assertStringIncludes(svg, ">npm</text>");
    assertStringIncludes(svg, "<rect"); // badge box
    assertStringIncludes(svg, "a wrapped");
  });

  it("omits version, badge and footer when not configured", () => {
    const svg = render(bannerTemplate, {
      template: "banner",
      title: "just a title",
    });

    assertStringIncludes(svg, ">just a title</text>");
    assertStringNotIncludes(svg, "<rect");
    assertArrayLength(svg.match(/<text/g), 1);
  });

  it("coerces a numeric version and escapes the title", () => {
    const svg = render(bannerTemplate, {
      template: "banner",
      title: "a & b",
      version: 2,
    });

    assertStringIncludes(svg, ">a &amp; b</text>");
    assertStringIncludes(svg, ">v2</text>");
  });

  it("ignores an empty-string subtitle", () => {
    const svg = render(bannerTemplate, {
      template: "banner",
      title: "t",
      subtitle: "",
    });

    // No subtitle → larger, single title line and nothing else textual.
    assertArrayLength(svg.match(/<text/g), 1);
  });
});

describe("cardTemplate", () => {
  it("centres the title and subtitle", () => {
    const svg = render(cardTemplate, {
      template: "card",
      title: "centered title",
      subtitle: "and a subtitle",
    });

    assertStringIncludes(svg, ">centered title</text>");
    assertStringIncludes(svg, ">and a subtitle</text>");
    assertStringIncludes(svg, 'text-anchor="middle"');
  });

  it("renders a footer when configured", () => {
    const svg = render(
      cardTemplate,
      { template: "card", title: "t" },
      { footer: "site.example" },
    );

    assertStringIncludes(svg, ">site.example</text>");
  });

  it("renders only the title when nothing else is given", () => {
    const svg = render(cardTemplate, { template: "card", title: "solo" });
    assertArrayLength(svg.match(/<text/g), 1);
  });
});
