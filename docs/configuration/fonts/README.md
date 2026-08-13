# Fonts

Colophon ships with two typefaces and uses them out of the box, so a project
that configures nothing still renders the same image on a laptop, in CI and in
a container.

| Family             | Cuts                    | Drawn by                         |
| ------------------ | ----------------------- | -------------------------------- |
| **Outfit**         | 400, 500, 600, 700, 800 | every template's words           |
| **JetBrains Mono** | 400, 700                | the `code` and `terminal` panels |

Both are under the [SIL Open Font License][ofl], and the licence text ships in
`fonts/` alongside them.

[ofl]: https://openfontlicense.org/

Only the cuts the built-in templates draw are included, since the whole of
either family would be most of a megabyte for weights nothing asks for. A weight
that is not there is drawn in the nearest one that is, which is what the
rasteriser does anyway.

## Supplying your own

`fonts` points at font files, and yours are used ahead of the bundled ones:

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

## System fonts

Installed fonts are loaded as well by default, behind the bundled ones. The
bundled faces are Latin, so a Japanese or Arabic title has only the machine's
own to be drawn in, and turning them off by default would render such a title as
nothing at all.

As soon as you configure any font of your own, installed fonts stop being
loaded, since a family you did not supply should not quietly resolve to
something that happens to be on the machine. Set `systemFonts: true` to have
both.

`systemFonts: false` with no fonts of your own is the way to ask for a build
that cannot depend on the machine without supplying any files. It used to be an
error, because it left nothing to render with; the bundled fonts are what it
leaves now.

An unknown family falls back to a loaded font rather than rendering nothing, so
a mismatched name shows up as the wrong typeface rather than a blank image. With
nothing configured that fallback is Outfit.

## Measuring rather than guessing

A configured font is also the font Colophon measures against when it decides
where a line of text breaks and how large it can be drawn. Glyph advances come
out of the file itself, so a title wraps where it really runs out of room, and a
long one is shrunk to fit rather than cut short.

The bundled fonts are measured the same way, so Latin text is measured rather
than estimated even when you configure nothing. Where no loaded face covers a
character, which for the bundled pair means anything outside Latin, Colophon
estimates instead: a fixed fraction of the font size per character, with
full-width characters counted as a whole em. That is rough, and supplying a file
for the script you are setting is what fixes it.

Weights follow the same rule as drawing does. A title asks for weight `800`, and
whichever of your faces is nearest that weight is both what gets drawn and what
gets measured, so the two agree.

## Fonts are not per-size

`fonts` and `systemFonts` are shared build inputs, so they cannot be overridden
by an individual output size. `fontFamily` can be, because it picks from the
fonts already loaded. See [Per-size config](../per-size-config/).
