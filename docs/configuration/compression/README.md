# File size

This page is about PNG, which is what a build writes unless
[`format`](../formats/) says otherwise. Under WebP, JPEG or AVIF none of it
applies: those have `quality` instead, and they are a good deal smaller than
anything here can make a PNG.

There are two settings here. `compressionLevel` makes the file smaller without
touching the picture, and `quantise` makes it smaller again by reducing the
colours in it.

Colophon compresses each rendered PNG again before handing it over, at a level
you can set:

```ts
export default defineConfig({
  compressionLevel: 9, // the default; 0 to 9
});
```

The images the rasteriser produces are encoded for speed rather than for size.
Re-encoding them at zlib's strongest setting takes a 1200x1200 gradient from
about 400KB to about 115KB, and the whole sample gallery in this repository from
4.4MB to 1.7MB.

## Nothing about the picture changes

This is lossless in the strictest sense. The image data is inflated and deflated
again with the pixels and the row filters untouched, so the file decodes to
exactly the bytes it did before, and the only difference is how hard the
deflater looked for matches.

There is no quality setting because there is nothing to trade away. The tests
decode an image before and after and compare the pixels, and compare the
inflated scanlines byte for byte as well, so the row filters are covered along
with them.

## What it costs

About 150ms per 1200x1200 image, on top of rendering it.

That is paid once per image rather than once per build, because an image whose
[rebuild stamp](../../rebuilds/) still matches is not rendered at all. A site
whose posts rarely change pays it on the posts that changed.

If a large first build is the thing you care about, `6` is most of the saving
for about a tenth of the time:

| Level | Sample gallery | Time for the gallery |
| ----- | -------------- | -------------------- |
| `0`   | 4.4MB          | none                 |
| `6`   | 2.1MB          | 0.3s                 |
| `9`   | 1.7MB          | 3.1s                 |

`0` writes the rasteriser's own bytes unchanged. So does any level when the
bytes are not a PNG that can be taken apart and put back together, which covers
both another format entirely and a PNG whose chunks do not read. Anything
outside 0 to 9 is a config error rather than a value clamped into range.

## Going further, with a palette

Lossless is where a PNG runs out of room. The larger saving is to reduce the
image to a palette of at most 256 colours, which is off by default:

```ts
export default defineConfig({
  quantise: true,
});
```

That takes the sample gallery from 1.7MB to 0.7MB, each image landing between
28% and 61% of the size zlib alone got it to. It costs less time than the pass
it replaces rather than more, around 46ms per image against 151ms, because
indexing the colours leaves a great deal less data to compress.

### What it trades away is the gradients

This is the one setting on this page that changes the picture. A meta image is
mostly a smooth wash of two or three brand colours, and 256 shades cannot always
hold one. The flat backgrounds in the gallery come through with no pixel changed
at all, while the mesh and gradient ones move a channel by up to about 17 levels
out of 255, which on a long fade is visible if you go looking for it.

So look at an image before turning this on across a site. It is a trade, and
which way it should go depends on the picture rather than on the number. Where a
template draws translucent pixels they survive quantisation, since a PNG palette
carries alpha of its own.

Quantising uses [sharp](https://sharp.pixelplumbing.com/), which is already
installed as a dependency for the [other formats](../formats/). The lossless
path does not, so a machine sharp has no binary for can still write PNGs at any
`compressionLevel`.

### The rebuild stamp survives it

An encoder that reads a picture and writes a new file around it drops what the
old file said about itself, which here would mean the `tEXt` chunk holding the
[rebuild stamp](../../rebuilds/). An image that came back without one would be
an image every later build rendered again, quietly and for ever, so Colophon
moves those chunks into the file it gets back. A `gAMA` from a custom
[rasteriser](../rasteriser/) is kept for the same reason: what a file says about
how it is meant to be shown is part of the image. Where the palette encoder
wrote a chunk of its own it keeps that one, since it describes the file it has
just produced rather than the one it read.

## Both settings change every image's stamp

They are part of each image's rebuild stamp, so changing either re-renders the
tree once.

For `quantise` that is the ordinary rule, since it changes the pixels. For
`compressionLevel` it is against the rule the stamp otherwise follows, which is
that only what changes a pixel belongs in it: that one changes no pixel but
every byte, and without it turning compression up would appear to do nothing
until each post next changed.

## They apply wherever an image is produced

`generate`, the CLI, `colophon preview` and `renderMetaImages` all go through
the same step, so a script taking the bytes away to write them itself gets the
same file a build would have written.

They apply to a custom [rasteriser](../rasteriser/) too, as long as what it
returns is a PNG. Anything else is handed back untouched.

## They are not per-size

Like `fonts`, these are shared build inputs rather than something an individual
output size can override: they are about how an image is encoded rather than
what it shows. See [Per-size config](../per-size-config/).
