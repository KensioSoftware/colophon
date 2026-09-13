---
description: Changes to rendering and configuration when upgrading Colophon from earlier versions.
---

# Upgrading

This page lists changes that may affect projects using older Colophon APIs or
rendering settings. Apply the sections relevant to your current code.

<a id="everything-re-renders-once-on-this-upgrade"></a>

## Rebuild stamps after an upgrade

Current [rebuild stamps](../rebuilds/) use a digest of Colophon's rendering
code. Older stamps used the package version. The first build after moving to
the new stamp format regenerates every image.

Later upgrades regenerate images only when the rendering digest changes.
It covers templates, layout, measurement, encoding, bundled fonts and
rendering dependencies.

This stamp change requires no config or API edits. Run
[`--dry-run`](../cli/#dry-runs) to see how many images the next build will
regenerate.

<a id="from-2x"></a>

## Updating rendering APIs and settings

The changes below replace older API names and text-sizing settings. Current
rendering measures text with loaded fonts.

Changes to rendering code can alter line wrapping and regenerate existing
images. Inspect representative images after upgrading.

### `renderSvgToPng` is `renderSvgToImage`

Rename calls to `renderSvgToPng` as `renderSvgToImage`:

```ts
// Before
import { renderSvgToPng } from "@kensio/colophon";

// After
import { renderSvgToImage } from "@kensio/colophon";
```

The arguments and return type are unchanged. Output remains PNG unless you
set another [format](../configuration/formats/).

### `RenderedMetaImage.png` is `bytes`

Read `bytes` from each `renderMetaImages` result in place of `png`:

```ts
for (const image of await renderMetaImages(props, config)) {
  await writeFile(`social-${image.name}.png`, image.bytes); // was image.png
}
```

Use `extensionFor(config.format)` when filenames should follow the selected
format.

### `stampPng` and `readPngStamp` are `stampImage` and `readImageStamp`

Use `stampImage` and `readImageStamp` for rebuild stamps in any supported
format:

```ts
// Before
import { readPngStamp, stampPng } from "@kensio/colophon";

// After
import { readImageStamp, stampImage } from "@kensio/colophon";
```

The arguments, return values and stamp contents are unchanged. Existing
image stamps are still recognised.

<a id="text-is-fitted-to-the-space-it-has"></a>

### Text fitting

Titles now shrink to fit their line allowance before being truncated. The
minimum is about two thirds of the preferred size.

This requires no config change. Previously truncated titles may now retain
more words at a smaller size.

### The `grain` texture has gone

The grain texture was removed because of its PNG size cost. In one sample,
it increased a 1200×1200 image from about 36KB to more than 1.7MB.

Remove `texture: { type: "grain" }`, which now fails validation. Try
`halftone` for a similar effect or choose another
[texture](../configuration/themes/#textures).

### Textures are coarser by default

Default texture lengths increased by 50% to remain visible at reduced
display sizes. Dot spacing changed from 44px to 66px, and ruled-line spacing
from 28px to 42px.

Set lengths explicitly to keep the previous appearance:

```ts
texture: { type: "dots", size: 5, gap: 44 },
```

At the same time, `SIZE_PRESETS.thumbnail` changed `textureScale` from `3`
to `2`. These changes cancel out for that preset's texture scale.

### `code.charWidthRatio` has gone

Code character widths now come from loaded font metrics.

Remove `code.charWidthRatio` from your config. For a custom font, supply its
file under [`fonts`](../configuration/fonts/) and set `code.fontFamily`.
The bundled JetBrains Mono is measured by default. Characters without loaded
metrics use an estimated width.

### `HighlightedCode.longestLine` has gone

`highlightCode` no longer returns a longest-line character count. Character
counts cannot represent width accurately for mixed scripts or different fonts.

If your code used this field, measure line widths with the `measure`
function on [`TemplateContext`](../templates/).

### `wrapText` takes a width and a measurer

```ts
// Before
wrapText(title, estimateCharsPerLine(width, fontSize, 0.58));

// After
wrapText(title, width, (line) => measure(line, { fontFamily, fontSize }));
```

The width is now in pixels. `wrapText` also breaks words wider than a line.
Remove calls to `estimateCharsPerLine`, which has been removed.

### `TemplateContext` carries a `measure`

Custom templates receive `measure` automatically. If your code constructs
a `TemplateContext` directly, add a measurer with `createMeasurer`:

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

<a id="from-1x"></a>

## Updating older template APIs

These changes were introduced with the [code template](../code-template/).

### `Template.render` may return a promise

`render` now returns `string | Promise<string>`, and `buildSvg` is async.

Synchronous custom templates continue to work. Add `await` to direct
`buildSvg` calls.

`renderMetaImages` and `generate` were already asynchronous and require no
change for this update.

### `MetaImageProps.title` is optional

`MetaImageProps.title` is optional. `walkContent` and `extractProps` accept
props blocks that omit it.

A code image can therefore contain only `code` and `language` with no
heading above the panel.

If you previously relied on titleless posts being skipped, return
`undefined` from a [props mapper](../configuration/frontmatter/) to exclude
them.
