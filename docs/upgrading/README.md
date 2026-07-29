# Upgrading

## From 2.x

Text is measured against the fonts a build actually renders with, instead of
being estimated from a per-template fudge factor. Wrapping and fitting change as
a result, and so do three pieces of the API.

Every image re-renders on the first build after the upgrade, as it does on any
upgrade: the package version is part of the [rebuild stamp](../rebuilds/).

### Text is fitted to the space it has

A title too long for its lines used to be wrapped at a fixed size and then cut.
It is now shrunk, down to about two thirds of its usual size, and only cut if it
still does not fit at that floor.

Nothing to change, but existing images will look different: titles that were
losing their last few words now keep them, at a smaller size.

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
