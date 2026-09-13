---
description: Render code snippets as social images with syntax highlighting and automatic text sizing.
---

# The code template

The `code` template renders a syntax-highlighted snippet on a rounded panel.
[Shiki](https://shiki.style) supplies the language grammars and VS Code themes.

The [`terminal` template](../templates/) uses the same code rendering with
window chrome. The sizing and styling options below apply to both.

Put the snippet in frontmatter and name its language:

```yaml
---
title: eslint changed TypeScript files only
slug: eslint-changed-ts-files-only
meta_img_props:
  template: code
  language: bash
  code: |
    mapfile -t CHANGED_TS < <(
      git diff origin/main --name-only \
        | grep '\.ts'
    )
---
```

## Props

| Prop       | Notes                                                            |
| ---------- | ---------------------------------------------------------------- |
| `code`     | The snippet. Trimmed, tabs expanded, common indentation removed. |
| `language` | Any [Shiki language]; unknown names fall back to plain text.     |
| `title`    | Optional heading above the panel. Omit for a bare code image.    |
| `filename` | Shown in the window bar, when `code.chrome` draws one.           |
| `mark`     | Text or a line to mark on the snippet. One, or a list.           |
| `theme`    | Optional per-post override of `config.code.theme`.               |

[Shiki language]: https://shiki.style/languages

Common Pygments language names, including `text`, `console` and
`html+handlebars`, are mapped to Shiki equivalents.

Common leading indentation is removed from the snippet before rendering.

The title sits above the panel. It wraps onto up to two lines and shrinks if
needed. A taller title leaves less vertical space for the snippet.

## How the font size is chosen

Colophon measures the widest line and counts the lines, then picks the largest
font size that fits on both axes within `minFontScale` and `maxFontScale`.

`minFontScale` and `maxFontScale` are fractions of the image width. Sizes with
the same width therefore use the same font-size limits, regardless of height.

Code that cannot fit at the minimum font size is truncated with an ellipsis.
The panel then shrinks to fit the visible code.

Landscape images have less vertical space than square images. At the default
minimum font size, an Open Graph image fits roughly nine lines of sixty
characters. Longer snippets can lose their final lines. Lower `minFontScale`
to show more code, or override it for the landscape size only. See
[Per-size config](../configuration/per-size-config/).

Truncation is reported through [`onWarning`](../configuration/warnings/):

```text
colophon: content/post/index.md: code snippet does not fit the 1200x630 image at
a legible size: 4 of 13 lines dropped. Shorten the sample, or lower
code.minFontScale to fit it in smaller.
```

## Styling

Set code styling under `config.code`:

```ts
export default defineConfig({
  colors: { brand: "#2563eb" },
  footer: "example.com",
  code: {
    theme: "night-owl", // any bundled Shiki theme
    fontFamily: '"JetBrains Mono", monospace',
    lineHeight: 1.55,
    tabSize: 2,
    cornerScale: 0.025,
    maxFontScale: 0.075, // fractions of the image width
    minFontScale: 0.025,
    lineNumbers: false,
    chrome: "none", // or "mono", or "macos"
    panelOpacity: 1,
    borderColor: "#ffffff",
    borderOpacity: 0.12,
  },
});
```

### Line numbers

`lineNumbers` adds line numbers using the theme's foreground colour at low
opacity.

Numbers align with the code baselines. Their gutter reduces the width
available for code. Its width uses the original snippet's line count, even
if some lines are truncated.

The ellipsis line marking truncated content has no line number.

### Window chrome

`chrome` adds a window title bar. Use `"mono"` for neutral buttons or
`"macos"` for red, yellow and green buttons.

<img src="../samples/code-window.png" alt="code template with window chrome and line numbers" width="60%" />

With chrome on, a post's `filename` prop is drawn in the bar:

```yaml
meta_img_props:
  template: code
  language: javascript
  filename: search.js
  code: |
    await fetch("/search", { method: "QUERY" });
```

For `code`, the optional `title` remains above the panel. `filename` labels the code file
inside the bar.

The [`terminal` template](../templates/) always shows the bar with macOS-style
buttons.

### Marking a token or a line

Use the `mark` prop to highlight text or a line:

```yaml
meta_img_props:
  template: code
  language: typescript
  mark: SlugStrategy
  code: |
    export function slugFromPath(relative: string, strategy: SlugStrategy) {
```

<img src="../samples/code-mark.png" alt="a boxed token and a highlighted line" width="60%" />

A string marks the first visible occurrence of that text with a box.

Use an object to select a specific line or column:

```yaml
mark:
  - text: "'QUERY'"
  - line: 5 # a band across the line
  - { line: 2, column: 11, length: 7 } # the same as the first, by hand
  - { text: JSON, color: "#facc15" }
```

Lines and columns are one-based. A mark with a line but no column draws a
band across the whole line.

Marks use `colors.brandWarm` by default. Set a mark's `color` to override it.

Marks are applied after the snippet is fitted. If the requested text or
position is missing from the visible code, Colophon reports an
[`onWarning`](../configuration/warnings/) message.

### The panel itself

`borderColor` and `borderOpacity` control the panel border. Set
`borderOpacity: 0` to remove it.

Set `panelOpacity` below `1` to show the background through the panel. This
also disables the panel's offset-rectangle shadow. See
[Textures](../configuration/themes/#textures) for background options.

<a id="supply-the-monospace-face"></a>

## Choosing a monospace font

Colophon includes JetBrains Mono and measures code using its glyph widths.
To use a different font, supply its file under [`fonts`](../configuration/fonts/)
and set `code.fontFamily` to its family name.

When no loaded font can measure a character, layout estimates its width as
`0.6` times the font size. A font with different proportions can cause columns
to drift. Supplying the font file avoids this mismatch.

The default stack ends in generic `monospace`, which can resolve to different
fonts on different machines. The bundled JetBrains Mono is used first.

The former `code.charWidthRatio` option has been removed. See
[Upgrading](../upgrading/).

<a id="snippets-holding-cjk"></a>

## Chinese, Japanese and Korean code

CJK characters are usually wider than Latin characters. Colophon measures
their glyph widths when a loaded font covers them and positions following
tokens accordingly.

JetBrains Mono has no CJK ideographs. The rasteriser falls back to another
font for a run containing unsupported characters. A whole comment may
therefore appear in a proportional system font.

For consistent mixed-script code, supply a CJK monospace font such as Sarasa
Mono or Noto Sans Mono CJK and select it explicitly:

```js
export default defineConfig({
  fonts: [{ path: "fonts/SarasaMonoSC-Regular.ttf" }],
  code: { fontFamily: "Sarasa Mono SC" },
});
```

These fonts use half-em Latin characters and full-em ideographs. Colophon
reads these widths from the font file.
