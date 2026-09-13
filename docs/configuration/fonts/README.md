---
description: Supply font files and control system font loading for Colophon image rendering.
---

# Fonts

Colophon includes Outfit for text and JetBrains Mono for code. These fonts are
used by default:

| Family             | Cuts                    | Drawn by                         |
| ------------------ | ----------------------- | -------------------------------- |
| **Outfit**         | 400, 500, 600, 700, 800 | every template's words           |
| **JetBrains Mono** | 400, 700                | the `code` and `terminal` panels |

Both are under the [SIL Open Font License][ofl], and the licence text ships in
`fonts/` alongside them.

[ofl]: https://openfontlicense.org/

The package includes the weights used by its built-in templates. When a
requested weight is unavailable, the renderer uses the nearest loaded weight.

## Supplying your own

List your font files under `fonts`. They take priority over the bundled fonts:

```ts
export default defineConfig({
  fonts: [
    { family: "Inter", path: "./fonts/Inter-Regular.ttf" },
    { path: "./fonts/Inter-Bold.ttf" },
    { path: "./fonts/JetBrainsMono-Regular.ttf" },
  ],
  code: { fontFamily: "JetBrains Mono" },
});
```

## One entry per file

Add a separate entry for each font file, including regular and bold faces.
Colophon reads the weight and style from the file and selects the face using
the template's `font-weight`.

Include a bold face for headings and badges, which can request weights up to
`900`. The renderer uses a loaded face for missing weights and does not
synthesise bold text.

## `family` is optional

The renderer matches fonts using the family name stored inside each file.
Setting `family` on the first configured font also sets the default
`fontFamily`. Otherwise, `fontFamily` keeps its default stack.

## Paths are files

Supported font files are `.ttf`, `.otf`, `.ttc` and `.otc`. Relative paths are
resolved from the working directory.

A missing file causes an error. Supply a valid font file to avoid the renderer
falling back to another loaded font.

To use font bytes already in memory, supply `{ data }` in place of `{ path }`.

## System fonts

System fonts are loaded by default as fallbacks after the bundled fonts. They
can provide characters outside the bundled fonts' Latin coverage, such as
Japanese or Arabic text.

Configuring your own fonts disables system font loading by default. Set
`systemFonts: true` to load system fonts as well.

Set `systemFonts: false` to use only the bundled fonts and any files you
supply. This makes font selection independent of the machine's installed fonts.

An unknown family name falls back to a loaded font. With the default config,
that fallback is Outfit.

<a id="measuring-rather-than-guessing"></a>

## Text measurement

Colophon reads glyph widths from loaded font files to calculate line breaks
and text size. It uses these measurements to fit text into the template.

The bundled fonts provide measurements for Latin text. If no loaded font
covers a character, Colophon estimates its width from the font size. Full-width
characters count as one em. Supply a font covering your text's script for more
accurate layout.

Measurement and rendering select the same available weight. For example, a
title requesting weight `800` uses the loaded face nearest to `800` for both.

<a id="fonts-are-not-per-size"></a>

## Fonts across output sizes

All output sizes share `fonts` and `systemFonts`. An individual size can
override `fontFamily` to select from the loaded fonts. See
[Per-size config](../per-size-config/).
