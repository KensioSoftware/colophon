# Upgrading

## From 2.x

Text is measured against the fonts a build actually renders with, instead of
being estimated from a per-template fudge factor. Wrapping and fitting change as
a result, and so do several pieces of the API.

Every image re-renders on the first build after the upgrade, as it does on any
upgrade: the package version is part of the [rebuild stamp](../rebuilds/).

### `renderSvgToPng` is `renderSvgToImage`

A build writes the format [`format`](../configuration/formats/) names, so the
function that produces the bytes is named for an image rather than for one of
the four things it may return.

```ts
// Before
import { renderSvgToPng } from "@kensio/colophon";

// After
import { renderSvgToImage } from "@kensio/colophon";
```

The arguments and the return type are unchanged, and it still returns PNG unless
`format` says otherwise.

### `RenderedMetaImage.png` is `bytes`

`renderMetaImages` returns the same objects with that one field renamed, for the
same reason:

```ts
for (const image of await renderMetaImages(props, config)) {
  await writeFile(`social-${image.name}.png`, image.bytes); // was image.png
}
```

`extensionFor(config.format)` is what a build names its own files with, if the
filename should follow the format too.

### `stampPng` and `readPngStamp` are `stampImage` and `readImageStamp`

The rebuild stamp goes into JPEG, WebP and AVIF as well as PNG now, so the two
functions that write and read it are named for images rather than for one
format. See [Rebuilds](../rebuilds/#where-the-stamp-goes).

```ts
// Before
import { readPngStamp, stampPng } from "@kensio/colophon";

// After
import { readImageStamp, stampImage } from "@kensio/colophon";
```

Nothing else changes: the arguments, the return values and the stamps themselves
are the same, so images already on disk are still recognised.

### Text is fitted to the space it has

A title too long for its lines used to be wrapped at a fixed size and then cut.
It is now shrunk, down to about two thirds of its usual size, and only cut if it
still does not fit at that floor.

Nothing to change, but existing images will look different: titles that were
losing their last few words now keep them, at a smaller size.

### The `grain` texture has gone

Per-pixel noise is the one thing PNG cannot compress, and film grain took a
1200×1200 image from around 36KB to a little over 1.7MB. That is not a cost
worth carrying for a treatment, and no theme ever turned it on.

`texture: { type: "grain" }` now fails validation with a message saying so.
Every other treatment is a fraction of the size; `halftone` is the nearest in
look, and [Textures](../configuration/themes/#textures) lists what each one
costs.

### Textures are coarser by default

Every treatment's lengths went up by half again, because a share image is
looked at somewhere between a third and a sixth of the size it is rendered at
and the old defaults were pitched to the full-size picture. Dots are 66px apart
rather than 44, ruled lines 42px rather than 28, and so on down the list.

Existing images will look different, though they re-render on the upgrade
anyway. A project that wants the old look names the lengths outright:

```ts
texture: { type: "dots", size: 5, gap: 44 },
```

`SIZE_PRESETS.thumbnail` came down from `textureScale: 3` to `2` with it, since
what that corrects for is the display size and the base it corrects from moved.
A thumbnail therefore looks exactly as it did.

### `code.charWidthRatio` has gone

The `code` template lays tokens out on a character grid, and this was the number
that said how wide a character is. It is measured from the monospace face now.

Delete it from your config, which otherwise fails validation with a message
saying the same thing. To have the width measured rather than assumed, supply
the face as a file under [`fonts`](../configuration/fonts/) and name it in
`code.fontFamily`. Builds that do neither fall back to the `0.6` that was the
default here.

### `wrapText` takes a width and a measurer

```ts
// Before
wrapText(title, estimateCharsPerLine(width, fontSize, 0.58));

// After
wrapText(title, width, (line) => measure(line, { fontFamily, fontSize }));
```

It wraps to a width in pixels rather than to a count of characters, and it
breaks a word that is too wide for a line of its own rather than letting it run
off the image. `estimateCharsPerLine` has gone with the factors it existed for.

### `TemplateContext` carries a `measure`

Custom templates receive a fourth field, `measure`, and need no changes to keep
working. What breaks is code that builds a `TemplateContext` itself to call a
template directly, which is mostly test code. Build one with `createMeasurer`:

```ts
const config = resolveConfig(userConfig);
const svg = await myTemplate.render({
  props,
  config,
  dimensions,
  measure: await createMeasurer(config),
});
```

`buildSvg`, `renderMetaImages` and `generate` all do this for you.

## From 1.x

Adding the [code template](../code-template/) made two small breaking changes.

### `Template.render` may return a promise

`render` now returns `string | Promise<string>`, and `buildSvg` is async.

A custom template that returns a string still works unchanged. What needs
updating is any direct call site of `buildSvg`, which now needs an `await`.

`renderMetaImages` and `generate` were already async, so nothing changes for
code that uses those.

### `MetaImageProps.title` is optional

`title` is no longer required, and `walkContent` and `extractProps` no longer
skip a file that declares props without one.

This is what lets a `code` post describe its image entirely through `code` and
`language`, with no heading above the panel.

If your project relied on a titleless props block being ignored, those posts
will now get images. Return `undefined` from a
[props mapper](../configuration/frontmatter/) to filter them out instead.
