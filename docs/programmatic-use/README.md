---
description: Generate social images from props or a content tree with the Colophon JavaScript API.
---

# Programmatic use

Use `renderMetaImages` to render props into image bytes. Use `generate` to
render and write images for a set of content pages.

## Render from props

`renderMetaImages` takes image props and config. It returns the rendered
images for your code to write or send:

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

The result contains one image per configured size. Each has a `name`,
`dimensions`, source `svg` and encoded `bytes`. The bytes use the configured
[format](../configuration/formats/). Use `extensionFor` to choose matching
filename extensions.

Use this function with data from any source, including database rows and API
responses.

## Walk content and generate

`generate` reads content files, renders images and writes the output. The CLI
uses this function:

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

`onResult` runs once per image, including images skipped because their
[rebuild stamps](../rebuilds/) match. Results for
[extra images](../configuration/extra-images/) have `contentPath: undefined`.

With `dryRun: true`, `skipped` is `true` for an up-to-date image and `false`
for one that would be rendered. The content and build plan are validated, but
no images or manifest are written. This is the API equivalent of
[`--dry-run`](../cli/#dry-runs).

<a id="options-that-are-not-config"></a>

### Build options

Pass execution and output callbacks directly to `generate`:

- `concurrency` limits the number of images processed at once and is excluded
  from rebuild stamps. Node's libuv thread pool also limits parallel work.
  Set `UV_THREADPOOL_SIZE` before starting Node to change its default of four
  threads. See [the thread pool](../cli/#the-thread-pool).
- `outputPath` chooses where each image is written. It takes precedence over
  [placement](../configuration/placement/), and results have no public URL
  when this callback is used.

The `walk` option overrides the corresponding
[`config.content`](../configuration/frontmatter/) settings.

<a id="generate-from-content-a-project-already-has"></a>

## Supplying content directly

Pass `contentFiles` when your application already has the pages to render:

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

Use this with database records, API responses or other data sources.
Generation still applies rebuild stamps, placement and manifest output.

Each entry is a `ContentFile` with these fields:

- `contentPath` is the page's relative path under the content root. It appears
  in warnings and determines the directory for
  [`beside-content`](../configuration/placement/) placement. The path is not
  opened and can describe a page without a file.
- `slug` determines the image's base filename and
  [manifest](../configuration/manifest/) key.
- `props` contains the image properties.
- `absolutePath` is optional. The `defaultOutputPath` helper requires it.

Colophon validates entries before rendering. Missing `contentPath`, `slug`
or `props` fields cause an error, as do paths or slugs that would escape the
content root.

With `contentFiles`, you can omit `contentDir` when using `public-dir`,
`custom` placement or an `outputPath` callback. The default `beside-content`
placement still requires `contentDir` as its output root.

Passing `walk` options with `contentFiles` causes an error. These options
apply only when reading frontmatter from files.

<a id="walking-on-its-own"></a>

## Reading content without rendering

`walkContent` finds files and reads their frontmatter:

```ts
import { walkContent } from "@kensio/colophon/content";

const files = await walkContent({ dir: "content" });
```

Import from `@kensio/colophon/content` to read content without loading the
rasteriser or syntax highlighter.

Use `readContentFile` for a single file. It accepts the file path, content
root and content options. It returns `undefined` when the file requests no
image. [`colophon preview`](../cli/) uses this function:

```ts
import { readContentFile } from "@kensio/colophon/content";

const file = await readContentFile("content/posts/hello.md", "content");
```

## Other exports

Lower-level exports include `buildSvg` and `renderSvgToImage` for rendering,
`resolveConfig` and `resolveConfigForSize` for configuration, and
`createMeasurer` for measuring text. Stamping helpers include `createStamper`,
`readImageStamp` and `stampImage`.

Import [`metaTags`](../configuration/meta-tags/) from `@kensio/colophon/meta`
and the [layout toolkit](../layout/) from `@kensio/colophon/layout`. These
subpaths avoid loading the renderer. The layout toolkit is also usable outside
Node.
