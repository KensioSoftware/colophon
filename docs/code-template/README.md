# The code template

The `code` template renders a syntax-highlighted snippet on a rounded panel over
the background. The colours come from a real VS Code theme, by way of
[Shiki](https://shiki.style).

The [`terminal` template](../templates/) is this one with window chrome around
it, so everything on this page applies to it too.

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

The title is drawn as one line at a fixed size, in the room set aside for it
above the panel. It is not wrapped or shrunk to fit, so keep it to a few words
and let the snippet carry the detail.

## How the font size is chosen

Colophon measures the longest line and the line count against a monospace grid,
then picks the largest font size that fits on both axes within
`minFontScale` and `maxFontScale`.

Those bounds are fractions of the image _width_, not its height. Width is what a
feed scales a share image to, so it is what legibility tracks. If the bounds
were fractions of the height, a landscape image would render the same snippet at
around half the size of its square counterpart.

Code that will not fit at the floor is truncated with an ellipsis rather than
shrunk to a size nobody can read. The panel then shrinks onto what is left, so
the remaining code is not sitting in a box built for more of it.

That trade matters most on the landscape sizes, which have around half the
vertical room of the square. At the default floor an Open Graph image fits
roughly nine lines of about sixty characters. A snippet written to that budget
renders identically at every size, whereas a longer one keeps its opening lines
and loses the tail. Lower `minFontScale` if you would rather show the whole
snippet small, or set it per size so that only the landscape shrinks; see
[Per-size config](../configuration/per-size-config/).

A finished image gives no sign that the sample continued, so a snippet that had
to lose lines is reported through [`onWarning`](../configuration/warnings/)
instead:

```text
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
    lineHeight: 1.55,
    tabSize: 2,
    cornerScale: 0.025,
    maxFontScale: 0.075, // fractions of the image width
    minFontScale: 0.025,
  },
});
```

## Supply the monospace face

The template positions every token absolutely from its character column, so how
wide one character is decides where each one sits. That width is measured from
the font, which means the face has to be one Colophon loaded: supply it as a
file under [`fonts`](../configuration/fonts/) and name it in `code.fontFamily`.

Without a file there is nothing to measure, and the layout falls back to
assuming `0.6` of the font size per character. That suits most monospace faces,
including Source Code Pro, Menlo and DejaVu Sans Mono, but Consolas is nearer
`0.55`, and a mismatch shows up as columns drifting across the line.

The default stack ends in the generic `monospace` family, which will resolve to
a face on any machine, but not to the same face on every machine.

This used to be a `code.charWidthRatio` setting. It has gone: see
[Upgrading](../upgrading/).
