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
  await writeFile(`social-${image.name}.png`, image.bytes);
}
```

One image is returned per configured output size. Each carries its `name`,
`dimensions`, the source `svg` and the encoded `bytes`, in whatever
[`format`](../configuration/formats/) the config asked for. `extensionFor` is
what a build names its own files with, if you would rather not hardcode `.png`.

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
  dryRun: false, // work out what would change and write nothing
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

Under `dryRun` the results say what a real build would have done: `skipped` is
`true` for an image whose stamp still matches, and `false` for one that would be
rendered. Nothing is written, not even the manifest, and every check a build
makes still runs. It is what the CLI's [`--dry-run`](../cli/) is.

### Options that are not config

Two `generate` options deliberately live outside `ColophonConfig`:

- **`concurrency`** is a property of the machine doing the build rather than of
  the images. Putting it in config would drag it into the rebuild stamp, so
  changing it would re-render the tree. What a build reaches is capped by the
  libuv thread pool, which holds four threads unless `UV_THREADPOOL_SIZE` was
  set in the environment the process started in. `generate` warns once where
  the concurrency is above it. [The command line](../cli/#the-thread-pool) has
  the measurements.
- **`outputPath`** is a callback that decides where each image is written. It
  takes precedence over [`placement`](../configuration/placement/), and when it
  is used there is no URL, because the placement no longer describes where the
  file went.

`generate`'s `walk` option is the programmatic equivalent of
[`config.content`](../configuration/frontmatter/) and wins where both are given.

## Generate from content a project already has

`contentFiles` hands `generate` the content to render, in place of a directory
to walk:

```ts
import { generate } from "@kensio/colophon";

await generate({
  contentFiles: entries.map((entry) => ({
    contentPath: `cidian/${entry.id}.json`,
    slug: entry.id,
    props: { template: "card", title: entry.headword, subtitle: entry.gloss },
  })),
  config: {
    placement: { strategy: "public-dir", dir: "public/og", urlBase: "/og" },
  },
});
```

This is the entry point for a site that keeps its pages somewhere other than a
tree of markdown files. Rows in a database, an API's responses and the sharded
JSON a large site packs its entries into all reach a build this way. Everything
after the content is the same. The images are stamped, skipped, placed and
written down in the manifest exactly as walked content is.

Each entry is a `ContentFile`, the shape `walkContent` returns:

- `contentPath` is the page's path under the content root. It names the page in
  warnings and in duplicate-slug messages, and the directories it carries are
  where [`beside-content`](../configuration/placement/) puts the image. It is
  never opened, and can name a page with no file behind it.
- `slug` is the base filename for the page's images, and the key it appears
  under in the [manifest](../configuration/manifest/).
- `props` is what to draw, in the shape a post's frontmatter declares.
- `absolutePath` is the file the page was read from, and can be left out.
  `defaultOutputPath` is the one thing that reads it, and it refuses a page
  that has none.

`generate` checks the entries before it renders anything. A page missing its
`contentPath`, `slug` or `props` stops the build, and so does a path or a slug
that would write an image outside the tree. The same checks run over a content tree while
its frontmatter is read.

`contentDir` is optional once `contentFiles` is given. The one build that still
needs it is a build placing images beside their content, which is the default
placement and has to be told the root to write under. A `public-dir` or
`custom` placement, or `generate`'s `outputPath`, says where the images go
without a content directory at all.

`walk` options describe reading frontmatter out of a file. Passing them
alongside `contentFiles` stops the build.

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

`readContentFile` is the same work for one file, which is what
[`colophon preview`](../cli/) uses. It takes the file, the content root its path
and slug are relative to, and the same options, and returns `undefined` where
the file asks for no image:

```ts
import { readContentFile } from "@kensio/colophon/content";

const file = await readContentFile("content/posts/hello.md", "content");
```

## Other exports

The pieces the above are built from are exported too, for anything that needs to
work at a lower level: `buildSvg` and `renderSvgToImage` for the two halves of
rendering, `resolveConfig` and `resolveConfigForSize` for config, the
[layout toolkit](../layout/) and `createMeasurer` for template authors, and
`createStamper`, `readImageStamp` and `stampImage` for the rebuild stamps.

[`metaTags`](../configuration/meta-tags/) has its own `@kensio/colophon/meta`
subpath, which loads neither the rasteriser nor the highlighter. So does
[the layout toolkit](../layout/), as `@kensio/colophon/layout`, which loads
nothing from Node at all.
