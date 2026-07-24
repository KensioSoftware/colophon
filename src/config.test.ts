import { describe, expect, it } from "vitest";

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
    expect(defineConfig(config)).toBe(config);
  });
});

describe("SIZE_PRESETS", () => {
  it("carries the standard social-image dimensions", () => {
    expect(SIZE_PRESETS.og).toStrictEqual({
      name: "og",
      width: 1200,
      height: 630,
    });
    expect(SIZE_PRESETS.square).toStrictEqual({
      name: "square",
      width: 1200,
      height: 1200,
    });
  });

  it("defaults to the Open Graph landscape plus a square", () => {
    expect(DEFAULT_SIZES).toStrictEqual([SIZE_PRESETS.og, SIZE_PRESETS.square]);
  });
});

describe("resolveConfig", () => {
  it("applies all defaults for an empty config", () => {
    const resolved = resolveConfig();

    expect(resolved.colors).toStrictEqual(DEFAULT_COLORS);
    expect(resolved.fontFamily).toBe(DEFAULT_FONT_FAMILY);
    expect(resolved.footer).toBeUndefined();
    expect(resolved.badge).toBeUndefined();
    expect(resolved.sizes).toBe(DEFAULT_SIZES);
    expect(resolved.background).toStrictEqual({
      type: "gradient",
      stops: [
        { offset: "0%", color: DEFAULT_COLORS.brandDark },
        { offset: "55%", color: DEFAULT_COLORS.brand },
        { offset: "100%", color: DEFAULT_COLORS.brandWarm },
      ],
    });
    expect(Object.keys(resolved.templates)).toStrictEqual(["banner", "card"]);
  });

  it("uses the brand colour for the whole gradient when only brand is given", () => {
    const resolved = resolveConfig({ colors: { brand: "#abcdef" } });

    expect(resolved.colors).toStrictEqual({
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

    expect(resolved.colors.brandDark).toBe("#000");
    expect(resolved.colors.brandWarm).toBe("#222");
    expect(resolved.colors.foreground).toBe("#eee");
  });

  it("prefers an explicit background over the derived gradient", () => {
    const background = { type: "solid", color: "#f00" } as const;
    expect(resolveConfig({ background }).background).toBe(background);
  });

  it("falls back to default sizes when given an empty list", () => {
    expect(resolveConfig({ sizes: [] }).sizes).toBe(DEFAULT_SIZES);
  });

  it("keeps a non-empty custom sizes list", () => {
    const sizes = [{ name: "wide", width: 100, height: 50 }];
    expect(resolveConfig({ sizes }).sizes).toBe(sizes);
  });

  it("rejects duplicate size names", () => {
    expect(() =>
      resolveConfig({
        sizes: [
          { name: "og", width: 1200, height: 630 },
          { name: "og", width: 800, height: 420 },
        ],
      }),
    ).toThrow(/Duplicate output size name "og"/);
  });

  it("merges custom templates over the built-ins", () => {
    const custom = { name: "custom", render: (): string => "" };
    const resolved = resolveConfig({ templates: { custom } });

    expect(resolved.templates["custom"]).toBe(custom);
    expect(resolved.templates["banner"]).toBeDefined();
  });
});
