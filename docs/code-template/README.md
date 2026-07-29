# The code template

The `code` template renders a syntax-highlighted snippet on a rounded panel over
the background. The colours come from a real VS Code theme, by way of
[Shiki](https://shiki.style).

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
| `theme`    | Optional per-post override of `config.code.theme`.               |

[Shiki language]: https://shiki.style/languages

Pygments-style names carried over from an older pipeline (`text`, `console`,
`html+handlebars` and so on) are mapped onto their Shiki equivalents, so
existing frontmatter usually needs no changes.

A snippet's leading indentation is dropped before anything else happens, so
lifting a sample out of a nested block costs you no width.

## How the font size is chosen

Colophon measures the longest line and the line count against a monospace grid,
then picks the largest font size that fits on both axes within
`minFontScale` and `maxFontScale`.

Those bounds are fractions of the image _width_, not its height. Width is what a
feed scales a share image to, so it is what legibility tracks. If the bounds
were fractions of the height, a landscape image would render the same snippet at
around half the size of its square counterpart.

Code that will not fit at the floor is truncated with an ellipsis rather than
shrunk into unreadability. The panel then shrinks onto what is left, so the
remaining code is not marooned in a larger box.

That trade matters most on the landscape sizes, which have around half the
vertical room of the square. At the default floor an Open Graph image fits
roughly nine lines of about sixty characters. A snippet written to that budget
renders identically at every size. A longer one keeps its opening lines and
loses the tail. Lower `minFontScale` if you would rather show the whole snippet
small, or set it per size so only the landscape shrinks; see
[Per-size config](../configuration/per-size-config/).

Nothing in a finished image says the sample continued, so Colophon says it
instead. A snippet that had to lose lines is reported through
[`onWarning`](../configuration/warnings/):

```
colophon: content/post/index.md: code snippet does not fit the 1200x630 image at
a legible size: 4 of 13 lines dropped. Shorten the sample, or lower
code.minFontScale to fit it in smaller.
```

## Styling

Styling comes from `config.code`:

```ts
export default defineConfig({
  colors: { brand: "#2563eb" },
  footer: "example.com",
  code: {
    theme: "night-owl", // any bundled Shiki theme
    fontFamily: '"JetBrains Mono", monospace',
    charWidthRatio: 0.6, // glyph advance / font size, for your monospace face
    lineHeight: 1.55,
    tabSize: 2,
    cornerScale: 0.025,
    maxFontScale: 0.075, // fractions of the image width
    minFontScale: 0.025,
  },
});
```

## Matching charWidthRatio to your font

The template positions every token absolutely from its character column, so
`charWidthRatio` is how the layout knows where each one sits. It has to match
the font actually being used, or the columns drift across the line.

`0.6` suits most monospace faces, including Source Code Pro, Menlo and DejaVu
Sans Mono. Consolas wants about `0.55`.

The reliable way to get the ratio you set is to supply the monospace face as a
file under [`fonts`](../configuration/fonts/), so the renderer is not left
picking whatever the machine has. The default stack ends in the generic
`monospace` family, which resolves to something everywhere but not to the same
thing everywhere.
