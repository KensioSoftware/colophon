# Programmatic use

The CLI is a thin wrapper over two entry points. Use them directly when a
project needs to drive generation itself.

## Render from props

The core takes props and config and returns rendered bytes. It touches no files
and knows nothing about content trees:

```ts
import { renderMetaImages } from "@kensio/colophon";
import { writeFile } from "node:fs/promises";

const images = await renderMetaImages(
  {
    template: "banner",
    title: "@kensio/colophon",
    subtitle: "Generate social meta images from frontmatter",
    version: "1.2.0",
  },
  {
    colors: { brand: "#2563eb" },
    footer: "example.com",
    badge: { text: "npm" },
  },
);

for (const image of images) {
  // image.name is the output-size name ("og", "square", and so on).
  await writeFile(`social-${image.name}.png`, image.png);
}
```

One image is returned per configured output size. Each carries its `name`,
`dimensions`, the source `svg` and the encoded `png` bytes.

This is the right entry point for rendering an image from data that is not a
markdown file at all, such as a database row or an API response.

## Walk content and generate

`generate` ties walking, rendering and writing together. This is what the CLI
calls:

```ts
import { generate } from "@kensio/colophon";

await generate({
  contentDir: "content",
  config: { colors: { brand: "#2563eb" } },
  overwrite: false,
  concurrency: 4, // defaults to one per available CPU
  onResult: (result) =>
    // result.url is where it is served, when the placement knows.
    console.log(`${result.skipped ? "skip" : "wrote"} ${result.outputPath}`),
});
```

`onResult` is called once per image, including the ones that were skipped
because their [stamp](../rebuilds/) still matched. A result for an
[extra image](../configuration/extra-images/) has `contentPath` set to
`undefined`, since there is no post behind it.

### Options that are not config

Two `generate` options deliberately live outside `ColophonConfig`:

- **`concurrency`** is a property of the machine doing the build rather than of
  the images. Putting it in config would drag it into the rebuild stamp, so
  changing it would re-render the tree.
- **`outputPath`** is a callback that decides where each image is written. It
  takes precedence over [`placement`](../configuration/placement/), and when it
  is used there is no URL, because the placement no longer describes where the
  file went.

`generate`'s `walk` option is the programmatic equivalent of
[`config.content`](../configuration/frontmatter/) and wins where both are given.

## Walking on its own

`walkContent` finds content files and reads their frontmatter, without rendering
anything:

```ts
import { walkContent } from "@kensio/colophon/content";

const files = await walkContent({ dir: "content" });
```

Import it from the `@kensio/colophon/content` subpath when frontmatter discovery
is all you want. The root entry point pulls in the rasteriser and the syntax
highlighter, and this subpath does not.

## Other exports

The pieces the above are built from are exported too, for anything that needs to
work at a lower level: `buildSvg` and `renderSvgToPng` for the two halves of
rendering, `resolveConfig` and `resolveConfigForSize` for config, `escapeXml`
and `wrapText` for template authors, and `createStamper`, `readPngStamp` and
`stampPng` for the rebuild stamps.

[`metaTags`](../configuration/meta-tags/) has its own `@kensio/colophon/meta`
subpath, which loads neither the rasteriser nor the highlighter.
