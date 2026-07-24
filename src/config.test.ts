import {
  assertArrayEquals,
  assertIdentical,
  assertNonNullable,
  assertObjectEquals,
  assertStringIncludes,
  assertThrowsError,
  assertUndefined,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import {
  DEFAULT_COLORS,
  DEFAULT_FONT_FAMILY,
  DEFAULT_SIZES,
  defineConfig,
  resolveConfig,
  SIZE_PRESETS,
} from "./config.js";

describe("defineConfig", () => {
  it("returns the config unchanged", () => {
    const config = { fontFamily: "Georgia" };
    assertIdentical(defineConfig(config), config);
  });
});

describe("SIZE_PRESETS", () => {
  it("carries the standard social-image dimensions", () => {
    assertObjectEquals(SIZE_PRESETS.og, {
      name: "og",
      width: 1200,
      height: 630,
    });
    assertObjectEquals(SIZE_PRESETS.square, {
      name: "square",
      width: 1200,
      height: 1200,
    });
  });

  it("defaults to the Open Graph landscape plus a square", () => {
    assertArrayEquals(DEFAULT_SIZES, [SIZE_PRESETS.og, SIZE_PRESETS.square]);
  });
});

describe("resolveConfig", () => {
  it("applies all defaults for an empty config", () => {
    const resolved = resolveConfig();

    assertIdentical(resolved.colors, DEFAULT_COLORS);
    assertIdentical(resolved.fontFamily, DEFAULT_FONT_FAMILY);
    assertUndefined(resolved.footer);
    assertUndefined(resolved.badge);
    assertIdentical(resolved.sizes, DEFAULT_SIZES);
    assertObjectEquals(resolved.background, {
      type: "gradient",
      stops: [
        { offset: "0%", color: DEFAULT_COLORS.brandDark },
        { offset: "55%", color: DEFAULT_COLORS.brand },
        { offset: "100%", color: DEFAULT_COLORS.brandWarm },
      ],
    });
    assertArrayEquals(Object.keys(resolved.templates), ["banner", "card"]);
  });

  it("uses the brand colour for the whole gradient when only brand is given", () => {
    const resolved = resolveConfig({ colors: { brand: "#abcdef" } });

    assertObjectEquals(resolved.colors, {
      brand: "#abcdef",
      brandDark: "#abcdef",
      brandWarm: "#abcdef",
      foreground: "#ffffff",
    });
  });

  it("keeps explicit dark/warm/foreground colours", () => {
    const resolved = resolveConfig({
      colors: {
        brand: "#111",
        brandDark: "#000",
        brandWarm: "#222",
        foreground: "#eee",
      },
    });

    assertIdentical(resolved.colors.brandDark, "#000");
    assertIdentical(resolved.colors.brandWarm, "#222");
    assertIdentical(resolved.colors.foreground, "#eee");
  });

  it("prefers an explicit background over the derived gradient", () => {
    const background = { type: "solid", color: "#f00" } as const;
    assertIdentical(resolveConfig({ background }).background, background);
  });

  it("falls back to default sizes when given an empty list", () => {
    assertIdentical(resolveConfig({ sizes: [] }).sizes, DEFAULT_SIZES);
  });

  it("keeps a non-empty custom sizes list", () => {
    const sizes = [{ name: "wide", width: 100, height: 50 }];
    assertIdentical(resolveConfig({ sizes }).sizes, sizes);
  });

  it("rejects duplicate size names", () => {
    const error = assertThrowsError(() =>
      resolveConfig({
        sizes: [
          { name: "og", width: 1200, height: 630 },
          { name: "og", width: 800, height: 420 },
        ],
      }),
    );

    assertStringIncludes(error.message, 'Duplicate output size name "og"');
  });

  it("merges custom templates over the built-ins", () => {
    const custom = { name: "custom", render: (): string => "" };
    const resolved = resolveConfig({ templates: { custom } });

    assertIdentical(resolved.templates["custom"], custom);
    assertNonNullable(resolved.templates["banner"]);
  });
});
