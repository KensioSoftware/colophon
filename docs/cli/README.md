---
description: Colophon command line options for generating and previewing social images.
---

# The command line

Use the Colophon CLI to generate images from a content directory or preview a
single post. It also creates starter config files and framework templates.

```text
colophon [contentDir] [options]    Render the images for a content tree
colophon init [contentDir]         Write a starter config module
colophon preview <file> [options]  Render one post and open it
colophon playground [file] [options]
                                   Print a configured playground link
colophon eject hugo                Write a Hugo partial that emits the tags
```

| Option                | What it does                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `-c`, `--config` path | Load a config module, whose default export is a config or a function returning it                                   |
| `-f`, `--force`       | Re-render every image, ignoring the stamps. For `init` and `eject`, replace a file                                  |
| `-o`, `--overwrite`   | Alias for `--force`                                                                                                 |
| `-n`, `--dry-run`     | Report what would change and write nothing                                                                          |
| `-w`, `--watch`       | Rebuild whenever a content file changes                                                                             |
| `--concurrency` n     | How many images to render at once. Defaults to one per available CPU, capped by [the thread pool](#the-thread-pool) |
| `--size` name         | Which configured size `preview` renders, or the playground link opens. Defaults to the first one                    |
| `-h`, `--help`        | Show the help text                                                                                                  |

The first argument selects a command or a content directory. The default
directory is `content`. Prefix a directory with `./` if its name matches a
command, such as `./init`, `./preview`, `./playground` or `./eject`.

Unknown options cause an error, including misspellings such as `--dry-runs`.
Option values can follow the flag or use `=`, as in
`--config colophon.config.ts` and `--config=colophon.config.ts`.

An option that belongs to another command, such as `--size` on a build, is
accepted and does nothing.

## Rendering a tree

```bash
colophon content --config colophon.config.ts
```

Colophon writes one image per configured size for each file with image props.
Each image contains a [stamp](../rebuilds/) recording its inputs. Later builds
use these stamps to skip unchanged images.

## colophon init

```bash
colophon init
```

`colophon init` writes a starter config in the working directory and prints
the command to use it. Common options are enabled, and the remaining options
are shown as commented examples.

The config is an ES module. If `package.json` contains `"type": "module"`,
the filename is `colophon.config.js`. Otherwise, it is `colophon.config.mjs`.

An existing config is preserved unless you pass `--force`. With `--force`,
Colophon replaces that file at its current path, including a
`colophon.config.ts` file.

The command looks for content in `content`, `src/content`, `posts`,
`src/posts`, `_posts` and `src/pages`. Pass a directory to choose it explicitly:

```bash
colophon init essays
```

## colophon preview

```bash
colophon preview content/posts/hello.md --config colophon.config.ts
```

`colophon preview` renders one post and opens the image in your default image
viewer. Use it while adjusting a template or colours.

The image is written to a temporary directory. Previewing leaves the post's
build output and rebuild stamps unchanged. The command also prints the image
path for use in a shell:

```bash
open "$(colophon preview content/posts/hello.md)"
```

One image is rendered, at the first configured size. `--size` picks another:

```bash
colophon preview content/posts/hello.md --size og
```

Preview requires the selected post to have image props. It reports an error
for a post that a normal build would skip.

## colophon playground

```bash
colophon playground
```

Prints a [colophonjs.dev playground](https://colophonjs.dev/playground/) URL
that carries the project's config and a sample post. The command finds a
`colophon.config.ts`, `.mts`, `.js` or `.mjs` in the working directory. Pass
`--config` when the config has another name.

The sample comes from the first post with image props in one of the content
directories that `colophon init` recognises. Name a post to use that one:

```bash
colophon playground content/posts/hello.md
```

Before creating the link, the command runs `content.props` and writes its
result into frontmatter using the configured `propsKey` and `templateField`.
This lets the playground render props computed by your project. If no suitable
post is found, the link uses a small `banner` sample.

The playground runs in the browser and supports JSON config. Links omit
fonts, logos, image backgrounds, custom templates, callbacks, placement,
manifests and extra images. They also omit file paths in `avatar` and `image`
props. The command lists omitted fields on stderr and writes only the URL to
stdout.

`--size` opens the link on one configured size:

```bash
colophon playground content/posts/hello.md --size square
```

## colophon eject

```bash
colophon eject hugo
colophon eject astro
```

`colophon eject` writes a template that adds image meta tags to your site's
pages:

| Generator | Written to                          |
| --------- | ----------------------------------- |
| `hugo`    | `layouts/partials/colophon.html`    |
| `astro`   | `src/components/ColophonMeta.astro` |

See [Astro](../astro/) for the Astro component and build integration. The
following instructions configure the Hugo partial.

The Hugo partial reads the current page's image from the
[manifest](../configuration/manifest/). Call it from your head template:

```go-html-template
{{ partial "colophon.html" . }}
```

Set `manifest` to `data/colophon.json` in your Colophon config. Hugo reads
site data from that directory.

The manifest supplies the image URL and dimensions used in the tags.

### What it emits

The partial emits the same image tags as [`metaTags`](../configuration/meta-tags/).
These include `og:image` with its dimensions and alt text, plus `twitter:image`
and `twitter:card`. Landscape images use `summary_large_image`, and square
images use `summary`.

### Finding the page

The partial searches for a manifest entry using these keys in order:

1. The page's `colophon_key` parameter.
2. The page's `slug`.
3. The page route.
4. The file's base name.

This supports both built-in [slug strategies](../configuration/sizes/#slug-strategies).
Set `colophon_key` when your site uses a custom key.

### The fallback chain

The partial chooses the image in this order:

1. The page's `images` parameter.
2. The generated image from the manifest.
3. The site's `images` parameter.

The `images` parameters follow Hugo's existing convention. Width, height and
alt tags are emitted only for the generated image.

A manifest entry without an image URL uses the site default. This can happen
when [placement](../configuration/placement/) has no `urlBase`.

<a id="it-is-yours-after-that"></a>

### Customising the partial

Edit the generated file to change the fallback order or add tags. Colophon
leaves it unchanged on later runs. `colophon eject hugo --force` overwrites
your edits.

The partial uses `hugo.Data`, which requires Hugo 0.156 or newer. For an older
Hugo version, change its two `hugo.Data` references to `site.Data`.

## Dry runs

```bash
colophon content --config colophon.config.ts --dry-run
```

`--dry-run` reports which images would be written or skipped. It writes no
images or [manifest](../configuration/manifest/):

```text
write content/hello/hello-og.png
skip  content/snippet/snippet-og.png
Dry run: 1 would be written, 1 already up to date. Nothing was written.
```

A dry run reads the content and rebuild stamps and validates the build plan.
It catches duplicate output paths, duplicate manifest keys and missing font
files.

Rendering is skipped during a dry run. Rendering warnings, such as
[truncated code snippets](../code-template/), appear only in a normal build.

## Watching

```bash
colophon content --config colophon.config.ts --watch
```

`--watch` builds the content directory, then rebuilds when a content file
changes. Rebuild stamps let it skip unchanged images. Stop the process to end
the watch.

The watch has two limits:

- Restart it after changing config or a custom template. Config modules and
  their imports are loaded once.
- It watches only extensions in
  [`content.extensions`](../configuration/frontmatter/), which defaults to
  `.md` and `.markdown`. Generated images and editor files such as `post.md~`
  and `.post.md.swp` are ignored.

Build errors are reported, and the watch continues waiting for changes.

## The thread pool

`--concurrency` limits the number of images being processed at once. It
defaults to the number of available CPUs. The libuv thread pool also limits
how much rendering work can run in parallel.

Rasterisation, PNG recompression (`zlib`) and quantisation (`sharp`) use the
libuv thread pool. Its default size is four threads. Extra work waits in a
queue. Colophon warns when the requested concurrency exceeds the pool size:

```text
colophon: Rendering 18 images at once, but the libuv thread pool has 4
threads. Rasterising, PNG recompression and quantising all run on that pool,
so only 4 renders make progress at a time. Set UV_THREADPOOL_SIZE=18 in the
environment before the process starts to lift the ceiling.
```

Set `UV_THREADPOOL_SIZE` in the environment before starting Colophon. Node
reads it when the pool is first used, which can happen before your config
module loads:

```bash
UV_THREADPOOL_SIZE=16 colophon content
```

Measured on an eighteen-core machine over 200 pages at 1200x630, PNG with
`quantise` on:

| `UV_THREADPOOL_SIZE` | Wall clock |
| -------------------- | ---------- |
| 4 (the default)      | 24.0 s     |
| 8                    | 18.5 s     |
| 16                   | 13.8 s     |
| 24                   | 13.7 s     |
| 32                   | 13.8 s     |

In this benchmark, increasing the pool beyond the core count gave little
further improvement. Start with a pool size close to the available CPU count
and measure your own build.
