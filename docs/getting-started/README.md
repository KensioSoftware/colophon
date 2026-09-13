---
description: Install Colophon and generate social images from Markdown frontmatter.
---

# Getting started

Colophon generates social images from the YAML frontmatter at the start of a
Markdown post. This guide installs the package and renders your first images.

## Install

```bash
pnpm add @kensio/colophon
```

The command examples below use `colophon`. For a local pnpm installation,
prefix each command with `pnpm exec`, or run it from a package script.

Colophon uses `@resvg/resvg-js` to convert SVG to PNG and `shiki` to highlight
[code snippets](../code-template/). Both are installed with the package. A
headless browser is not required.

Colophon includes fonts for consistent rendering across machines. You can also
[supply your own font files](../configuration/fonts/).

## Describe the image in frontmatter

```yaml
---
title: My post
meta_img_props:
  template: banner
  title: "@kensio/colophon"
  subtitle: Generate social meta images from frontmatter
  version: 1.2.0
---
```

`meta_img_props` contains the properties passed to the image template. You can
[change this key or map existing frontmatter fields](../configuration/frontmatter/)
to image properties.

## Add a config file

A config file lets you set branding and output options. You can omit it to use
the defaults. Run `colophon init` to create a starter config and detect the
content directory:

```bash
colophon init
```

```ts
// colophon.config.ts
import { defineConfig } from "@kensio/colophon";

export default defineConfig({
  colors: { brand: "#2563eb", brandDark: "#1e3a8a", brandWarm: "#f59e0b" },
  footer: "example.com",
  badge: { text: "npm" },
});
```

Or pick a [theme](../configuration/themes/) and let it choose the colours:

```ts
export default defineConfig({
  theme: "midnight",
  footer: "example.com",
});
```

Every option is listed in [Configuration](../configuration/).

## Run it over a content tree

```bash
colophon content --config colophon.config.ts
```

For each file with `meta_img_props`, Colophon writes one PNG per output size
next to the post. Filenames follow `<slug>-<size>.png`. With the defaults,
`post/index.md` produces `post/post-og.png` and `post/post-square.png`.

Use [placement settings](../configuration/placement/) to write images to a
shared directory such as `public/og/` and assign their public URLs.

## Command line options

```text
colophon [contentDir] [options]    Render the images for a content tree
colophon init [contentDir]         Write a starter config module
colophon preview <file> [options]  Render one post and open it
colophon playground [file] [options]
                                   Print a configured playground link

  -c, --config <path>   Config module whose default export is a ColophonConfig,
                        or a function returning one
  -f, --force           Re-render every image, ignoring the stamps
  -o, --overwrite       Alias for --force
  -n, --dry-run         Report what would change and write nothing
  -w, --watch           Rebuild whenever a content file changes
  --concurrency <n>     How many images to render at once
  --size <name>         Which configured size preview renders, or the
                        playground link opens
  -h, --help            Show help

  contentDir            defaults to "content"
  --concurrency         defaults to one per available CPU
  --size                defaults to the first configured size
```

`--concurrency` limits how many images Colophon renders at once. It defaults
to the number of available CPUs. Lower it when the machine also runs other
workloads.

Node's libuv thread pool runs rasterisation, PNG recompression and
quantisation. It defaults to four threads, which can limit rendering on
machines with more cores. Set its size before starting Colophon:

```bash
UV_THREADPOOL_SIZE=16 colophon content
```

In a benchmark of 200 pages at 1200x630 on an eighteen-core machine, increasing
the pool from 4 to 16 threads reduced the build time from 24 to 13.8 seconds.
See [the thread pool](../cli/#the-thread-pool) for the benchmark and tuning
guidance.

Use `colophon preview <file>` to render and open one post's image. Use `--watch`
to rebuild when content changes. [The command line](../cli/) explains these
commands and their options.

## Where to go next

- [The command line](../cli/) covers `init`, `preview`, dry runs and watching.
- [Templates](../templates/) covers the built-in layouts and how to add one.
- [Rebuilds](../rebuilds/) explains when an image is rendered again.
- [Programmatic use](../programmatic-use/) covers the API the CLI is built on.
