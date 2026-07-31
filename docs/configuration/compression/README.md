# File size

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

This is lossless in the strongest sense there is. The image data is inflated and
deflated again with the pixels and the row filters untouched, so the file
decodes to exactly the bytes it did before. Only how hard the deflater looked
for matches is different.

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

## It changes every image's stamp

The level is part of each image's rebuild stamp, so turning it up re-renders
the tree once. That is against the rule the stamp otherwise follows, which is
that only what changes a pixel belongs in it: this changes no pixel but every
byte, and without it the setting would appear to do nothing until each post
next changed.

## It applies wherever an image is produced

`generate`, the CLI, `colophon preview` and `renderMetaImages` all go through
the same step, so a script taking the bytes away to write them itself gets the
same file a build would have written.

It applies to a custom [rasteriser](../rasteriser/) too, as long as what that
returns is a PNG. Anything else is handed back untouched.

## It is not per-size

Like `fonts`, this is a shared build input rather than something an individual
output size can override: it is about how an image is encoded rather than what
it shows. See [Per-size config](../per-size-config/).
