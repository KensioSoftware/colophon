# Fonts

By default Colophon names font families and leaves the machine to supply them,
which is how the same post can render differently on a laptop and in CI.

Pointing `fonts` at font files instead takes the machine out of it:

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

Weight and style are read from the font itself, so a regular and a bold face are
two entries and the template's `font-weight` picks between them.

Supply the bold face. Templates ask for weights up to `900` for titles and
badges, and a missing weight is drawn with the face you did supply rather than
being synthesised into a fake bold.

## `family` is optional

It does not affect matching, since the family name inside the file does that.
Naming it on the first font saves setting `fontFamily`, which otherwise stays on
the default stack.

## Paths are files

`.ttf`, `.otf`, `.ttc` and `.otc`, resolved from the working directory when
relative.

A path that is not there is an error. The renderer ignores a font file it cannot
read and draws the text in whatever else it holds, so without the check a
mistyped path would surface as a blank image much later.

To load a font you already have in memory, fetched at build time or bundled,
pass `{ data }` with its bytes instead of a path.

## System fonts switch off

As soon as you configure any font, installed fonts stop being loaded. That is
deliberate, since it means a family you did not supply cannot quietly resolve to
something that happens to be on the machine.

Set `systemFonts: true` to have both, at the cost of the reproducibility that
configuring fonts was for.

An unknown family falls back to a configured font rather than rendering nothing,
so a mismatched name shows up as the wrong typeface rather than a blank image.

## Measuring rather than guessing

A configured font is also the font Colophon measures against when it decides
where a line of text breaks and how large it can be drawn. Glyph advances come
out of the file itself, so a title wraps where it really runs out of room, and a
long one is shrunk to fit rather than cut short.

Without a font file there is nothing to measure, because the text will be drawn
in whatever the machine has. Colophon estimates instead: a fixed fraction of the
font size per character, with full-width characters counted as a whole em. That
is close enough for Latin text and rough for everything else, which is another
reason to supply the file.

Weights follow the same rule as drawing does. A title asks for weight `800`, and
whichever of your faces is nearest that weight is both what gets drawn and what
gets measured, so the two agree.

## Fonts are not per-size

`fonts` and `systemFonts` are shared build inputs, so they cannot be overridden
by an individual output size. `fontFamily` can be, because it picks from the
fonts already loaded. See [Per-size config](../per-size-config/).
