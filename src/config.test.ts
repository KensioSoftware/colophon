import path from "node:path";

import {
  assertArrayEquals,
  assertArrayLength,
  assertFalse,
  assertIdentical,
  assertNonNullable,
  assertObjectEquals,
  assertStringIncludes,
  assertThrowsError,
  assertTrue,
  assertUndefined,
} from "@kensio/smartass";
import { describe, it, vi } from "vitest";

import {
  DEFAULT_CODE_STYLE,
  DEFAULT_COLORS,
  DEFAULT_COMPRESSION_LEVEL,
  DEFAULT_FONT_FAMILY,
  DEFAULT_SIZES,
  defineConfig,
  resolveConfig,
  SIZE_PRESETS,
} from "./config/index.js";
import { resolveConfigForSize } from "./config/size.js";
import { themeNames } from "./theme/index.js";
import type { ColophonConfig } from "./types.js";

// A real font file: resolution checks that the path is there, so a fictional
// one would not get past it.
const sansFont = path.join(
  process.cwd(),
  "node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf",
);

/** A config module's other shape: a function computing the config. */
const georgia = (): ColophonConfig => ({ fontFamily: "Georgia" });

describe("defineConfig", () => {
  it("returns the config unchanged", () => {
    const config = { fontFamily: "Georgia" };
    assertIdentical(defineConfig(config), config);
  });

  it("returns a config function unchanged, without calling it", () => {
    assertIdentical(defineConfig(georgia), georgia);
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
    assertArrayEquals(Object.keys(resolved.templates), [
      "article",
      "banner",
      "card",
      "code",
      "docs",
      "event",
      "photo",
      "quote",
      "release",
      "stat",
      "terminal",
      "wordmark",
    ]);
    assertObjectEquals(resolved.code, DEFAULT_CODE_STYLE);
  });

  it("warns through console by default, or through a supplied handler", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    resolveConfig().onWarning("something did not fit");

    assertArrayEquals(spy.mock.calls[0], ["colophon: something did not fit"]);

    const warnings: string[] = [];
    resolveConfig({
      onWarning: (m) => {
        warnings.push(m);
      },
    }).onWarning("mine");

    assertArrayEquals(warnings, ["mine"]);
    assertArrayLength(spy.mock.calls, 1);
  });

  it("merges code style over the defaults", () => {
    const resolved = resolveConfig({ code: { theme: "monokai", tabSize: 4 } });

    assertIdentical(resolved.code.theme, "monokai");
    assertIdentical(resolved.code.tabSize, 4);
    assertIdentical(resolved.code.lineHeight, DEFAULT_CODE_STYLE.lineHeight);
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

  it("has no texture unless one is asked for", () => {
    assertUndefined(resolveConfig().texture);
  });

  it("takes a theme's palette, background and texture", () => {
    const resolved = resolveConfig({ theme: "midnight" });

    assertIdentical(resolved.colors.foreground, "#e6e9f5");
    assertIdentical(resolved.background.type, "mesh");
    assertIdentical(resolved.texture?.type, "dots");
  });

  it("turns grain on for no theme, whatever it costs a project in bytes", () => {
    // Per-pixel noise takes a 1200x1200 PNG past 2MB, which is not something to
    // hand someone who picked a theme by its name.
    const grainy = themeNames.filter(
      (theme) => resolveConfig({ theme }).texture?.type === "grain",
    );

    assertArrayLength(grainy, 0);
  });

  it("lets the config win over the theme, field by field", () => {
    const resolved = resolveConfig({
      theme: "midnight",
      colors: { brand: "#0d9488" },
      // Not `dots`, which is what midnight brings: a texture the theme would
      // have supplied anyway proves nothing about which of the two won.
      texture: { type: "rules" },
    });

    // The palette is the config's, resolved by the usual rules, and the
    // background is still the theme's: a theme is a set of defaults, and the
    // background it draws is part of the look rather than something derived
    // from the colours.
    assertIdentical(resolved.colors.brand, "#0d9488");
    assertIdentical(resolved.colors.brandWarm, "#0d9488");
    assertIdentical(resolved.background.type, "mesh");
    assertIdentical(resolved.texture?.type, "rules");
  });

  it("colours a theme's texture from the palette in force", () => {
    // `paper` rules its background in the foreground colour, so a config that
    // changes the text colour changes the lines with it.
    const themed = resolveConfig({ theme: "paper" });
    const overridden = resolveConfig({
      theme: "paper",
      colors: { brand: "#b45309", foreground: "#334155" },
    });

    assertObjectEquals(themed.texture, {
      type: "rules",
      opacity: 0.05,
      color: "#1c1917",
    });
    assertObjectEquals(overridden.texture, {
      type: "rules",
      opacity: 0.05,
      color: "#334155",
    });
  });

  it("leaves a theme that brings no texture without one", () => {
    assertUndefined(resolveConfig({ theme: "bloom" }).texture);
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

  it("rejects an unknown option before resolving anything", () => {
    const error = assertThrowsError(() =>
      resolveConfig({ dimensions: [] } as ColophonConfig),
    );

    assertStringIncludes(error.message, 'Did you mean "sizes"?');
  });

  it("loads no fonts and allows system ones by default", () => {
    const resolved = resolveConfig();

    assertArrayLength(resolved.fonts, 0);
    assertTrue(resolved.systemFonts);
  });

  it("turns system fonts off once fonts are configured", () => {
    const resolved = resolveConfig({ fonts: [{ path: sansFont }] });

    assertFalse(resolved.systemFonts);
  });

  it("keeps system fonts when a project asks for both", () => {
    const resolved = resolveConfig({
      fonts: [{ path: sansFont }],
      systemFonts: true,
    });

    assertTrue(resolved.systemFonts);
  });

  it("refuses to disable system fonts with nothing to render with", () => {
    const error = assertThrowsError(() =>
      resolveConfig({ systemFonts: false }),
    );

    assertStringIncludes(error.message, "no fonts are configured");
  });

  it("takes the font family from the first configured font", () => {
    const resolved = resolveConfig({
      fonts: [
        { family: "DejaVu Sans", path: sansFont },
        { family: "DejaVu Serif", path: sansFont },
      ],
    });

    assertIdentical(resolved.fontFamily, "DejaVu Sans");
  });

  it("prefers an explicit font family over a configured font's", () => {
    const resolved = resolveConfig({
      fonts: [{ family: "DejaVu Sans", path: sansFont }],
      fontFamily: "Georgia, serif",
    });

    assertIdentical(resolved.fontFamily, "Georgia, serif");
  });

  it("falls back to the default family when no font names one", () => {
    const resolved = resolveConfig({ fonts: [{ path: sansFont }] });

    assertIdentical(resolved.fontFamily, DEFAULT_FONT_FAMILY);
  });

  it("makes a logo path absolute and checks it is there", () => {
    const logo = "docs/samples/card-wide-solid.png";

    assertObjectEquals(resolveConfig({ logo: { path: logo } }).logo, {
      path: path.join(process.cwd(), logo),
    });
  });

  it("rejects a logo that is not there", () => {
    assertThrowsError(
      () => resolveConfig({ logo: { path: "nope.png" } }),
      "image file not found",
    );
  });

  it("compresses hardest by default, and takes any level zlib does", () => {
    assertIdentical(
      resolveConfig().compressionLevel,
      DEFAULT_COMPRESSION_LEVEL,
    );
    assertIdentical(resolveConfig({ compressionLevel: 0 }).compressionLevel, 0);
    assertIdentical(resolveConfig({ compressionLevel: 6 }).compressionLevel, 6);
  });

  it("leaves the picture alone unless a config asks for a palette", () => {
    assertFalse(resolveConfig().quantise);
    assertTrue(resolveConfig({ quantise: true }).quantise);
  });

  it("rejects a compression level zlib has no meaning for", () => {
    // Rejected rather than clamped: 10 is a number somebody had in mind, and
    // rendering at 9 without a word would leave them believing they got it.
    assertThrowsError(
      () => resolveConfig({ compressionLevel: 10 }),
      "Invalid compressionLevel 10",
    );
    assertThrowsError(
      () => resolveConfig({ compressionLevel: -1 }),
      "Invalid compressionLevel -1",
    );
    assertThrowsError(
      () => resolveConfig({ compressionLevel: 6.5 }),
      "Invalid compressionLevel 6.5",
    );
  });

  it("merges custom templates over the built-ins", () => {
    const custom = { name: "custom", render: (): string => "" };
    const resolved = resolveConfig({ templates: { custom } });

    assertIdentical(resolved.templates["custom"], custom);
    assertNonNullable(resolved.templates["banner"]);
  });
});

describe("resolveConfigForSize", () => {
  const square = SIZE_PRESETS.square;

  it("resolves the config unchanged when a size overrides nothing", () => {
    const config: ColophonConfig = { colors: { brand: "#2563eb" } };
    const forSize = resolveConfigForSize(config, square);
    const plain = resolveConfig(config);

    assertObjectEquals(forSize.colors, plain.colors);
    assertObjectEquals(forSize.background, plain.background);
    assertObjectEquals(forSize.code, plain.code);
    assertIdentical(forSize.fontFamily, plain.fontFamily);
    assertUndefined(forSize.footer);
  });

  it("merges a code override over the config's, keeping the rest", () => {
    const resolved = resolveConfigForSize(
      { code: { theme: "monokai", minFontScale: 0.03 } },
      { ...square, code: { minFontScale: 0.011 } },
    );

    assertIdentical(resolved.code.minFontScale, 0.011);
    // The point of merging: overriding one setting must not reset the others
    // to their defaults.
    assertIdentical(resolved.code.theme, "monokai");
  });

  it("merges a colors override over the config's", () => {
    const resolved = resolveConfigForSize(
      { colors: { brand: "#2563eb", foreground: "#eeeeee" } },
      { ...square, colors: { brand: "#0d9488" } },
    );

    assertIdentical(resolved.colors.brand, "#0d9488");
    assertIdentical(resolved.colors.foreground, "#eeeeee");
  });

  it("lets a size override one shade without naming the brand", () => {
    const resolved = resolveConfigForSize(
      { colors: { brand: "#2563eb", brandWarm: "#f59e0b" } },
      { ...square, colors: { foreground: "#111827" } },
    );

    assertIdentical(resolved.colors.foreground, "#111827");
    assertIdentical(resolved.colors.brand, "#2563eb");
    assertIdentical(resolved.colors.brandWarm, "#f59e0b");
  });

  it("keeps the default palette when a size overrides only the foreground", () => {
    const resolved = resolveConfigForSize(undefined, {
      ...square,
      colors: { foreground: "#111827" },
    });

    // Merging onto nothing would leave a lone `foreground`, and the rule that a
    // bare brand colours the whole gradient would then flatten the defaults.
    assertObjectEquals(resolved.colors, {
      ...DEFAULT_COLORS,
      foreground: "#111827",
    });
    assertObjectEquals(resolved.background, resolveConfig().background);
  });

  it("keeps a theme's palette when a size overrides one shade of it", () => {
    const resolved = resolveConfigForSize(
      { theme: "midnight" },
      {
        ...square,
        colors: { foreground: "#ffffff" },
      },
    );

    // Without the theme as the merge base this would fall back to the neutral
    // default palette, so a size asking for whiter text would quietly lose the
    // other three shades.
    assertIdentical(resolved.colors.foreground, "#ffffff");
    assertIdentical(resolved.colors.brand, "#6366f1");
    assertIdentical(resolved.background.type, "mesh");
  });

  it("lets a size choose a different theme", () => {
    const resolved = resolveConfigForSize(
      { theme: "midnight" },
      {
        ...square,
        theme: "paper",
      },
    );

    assertIdentical(resolved.colors.foreground, "#1c1917");
    assertObjectEquals(resolved.background, {
      type: "solid",
      color: "#faf7f0",
    });
  });

  it("replaces the config's texture for one size", () => {
    const resolved = resolveConfigForSize(
      { texture: { type: "grain" } },
      { ...square, texture: { type: "dots", gap: 60 } },
    );

    assertObjectEquals(resolved.texture, {
      type: "dots",
      gap: 60,
      color: DEFAULT_COLORS.foreground,
    });
  });

  it("rebuilds the derived gradient around an overridden brand", () => {
    const resolved = resolveConfigForSize(
      { colors: { brand: "#2563eb" } },
      { ...square, colors: { brand: "#0d9488" } },
    );

    // Nothing derived may be left pointing at the config-level colour: the
    // background follows the brand exactly as it would at the top level.
    assertObjectEquals(resolved.background, {
      type: "gradient",
      stops: [
        { offset: "0%", color: "#0d9488" },
        { offset: "55%", color: "#0d9488" },
        { offset: "100%", color: "#0d9488" },
      ],
    });
  });

  it("replaces the background rather than merging the variants", () => {
    const resolved = resolveConfigForSize(
      {
        background: {
          type: "gradient",
          stops: [{ offset: "0%", color: "#000000" }],
        },
      },
      { ...square, background: { type: "solid", color: "#ffffff" } },
    );

    // A gradient's `stops` surviving onto a solid would be a background that is
    // neither variant.
    assertObjectEquals(resolved.background, {
      type: "solid",
      color: "#ffffff",
    });
  });

  it("overrides the plain settings a size can carry", () => {
    const resolved = resolveConfigForSize(
      { footer: "example.com", fontFamily: "Georgia, serif" },
      { ...square, footer: "beta.example.com", badge: { text: "beta" } },
    );

    assertIdentical(resolved.footer, "beta.example.com");
    assertIdentical(resolved.fontFamily, "Georgia, serif");
    assertObjectEquals(resolved.badge, { text: "beta" });
  });

  it("is safe with no config at all", () => {
    const resolved = resolveConfigForSize(undefined, {
      ...square,
      footer: "example.com",
    });

    assertIdentical(resolved.footer, "example.com");
    assertIdentical(resolved.colors.brand, DEFAULT_COLORS.brand);
  });
});
