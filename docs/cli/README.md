# The command line

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

The first argument is read as a command only where it names one, so a content
directory called `init`, `preview`, `playground` or `eject` has to be written as
`./init`. Everything
else stays as it was: with no command, the first argument is the content
directory, and `content` is the default.

An option the CLI does not have is an error rather than something it ignores.
`--dry-runs` would otherwise render and write the whole tree, which is the one
thing the run was asking it not to do. A value can be joined to its flag or
follow it, so `--config=colophon.config.ts` and `--config colophon.config.ts`
are the same thing.

An option that belongs to another command, such as `--size` on a build, is
accepted and does nothing.

## Rendering a tree

```bash
colophon content --config colophon.config.ts
```

Every file that declares image props gets one image per output size. Images
carry a [stamp](../rebuilds/) of the props, config and size they came from, so a
second run renders only what has actually changed.

## colophon init

```bash
colophon init
```

Writes a starter config module in the working directory and prints the command
to run against it. The config has the fields most projects change, with the rest
commented out and explained.

It writes `colophon.config.js` where the project's `package.json` says
`"type": "module"`, and `colophon.config.mjs` where it does not: a Colophon
config is an ES module, and in a CommonJS project a `.js` config would fail the
import that `--config` does.

A config module that is already there is left alone unless `--force` is given,
and then it is replaced at its own path, so a project that settled on
`colophon.config.ts` does not end up holding two configs.

The content directory in the printed command is a guess, taken from the usual
places (`content`, `src/content`, `posts`, `src/posts`, `_posts`, `src/pages`).
Name yours to skip the guess:

```bash
colophon init essays
```

## colophon preview

```bash
colophon preview content/posts/hello.md --config colophon.config.ts
```

Renders that one post and opens the image, which is what tuning a template or a
palette wants, since the alternative is running the whole build and then picking
the one image out of it that was being worked on.

The image goes to a temporary directory rather than into the content tree.
Written beside the post it would land on the real image, which the next build
would then find unstamped and render again, so previewing would quietly
invalidate the tree it was previewing against. The path is printed as well as
opened, so a shell can do something else with the file:

```bash
open "$(colophon preview content/posts/hello.md)"
```

One image is rendered, at the first configured size. `--size` picks another:

```bash
colophon preview content/posts/hello.md --size og
```

A post that declares no image props is an error here, because the run named that
file, whereas in a build the same post is skipped.

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

The command runs `content.props` before it builds the link. It writes the
resulting props into the shared frontmatter, under the configured `propsKey`
and `templateField`. The browser can therefore render a post whose props
normally come from JavaScript. If no content directory or image post is found,
the link contains a small `banner` sample.

The playground has no filesystem and cannot run functions from a config
module. The link leaves out fonts, logos, image backgrounds, custom templates,
callbacks, placement, manifests and extra images. File paths in a post's
`avatar` and `image` props are left out too. The command writes a warning to
stderr that names every omitted field. The URL itself is the only line written
to stdout, so it can be captured by another command.

`--size` opens the link on one configured size:

```bash
colophon playground content/posts/hello.md --size square
```

## colophon eject

```bash
colophon eject hugo
colophon eject astro
```

Writes a template into your site that emits the meta tags for the page being
rendered. There is one per generator:

| Generator | Written to                          |
| --------- | ----------------------------------- |
| `hugo`    | `layouts/partials/colophon.html`    |
| `astro`   | `src/components/ColophonMeta.astro` |

The Astro one is half of [the Astro integration](../astro/); the rest of this
section is about the Hugo one.

Writes `layouts/partials/colophon.html` into a Hugo site: a partial that looks
the current page up in the [manifest](../configuration/manifest/) and emits its
social meta tags. Call it from your head:

```go-html-template
{{ partial "colophon.html" . }}
```

and point `manifest` at `data/colophon.json`, which is where Hugo reads site
data from.

Without it a Hugo site has to do this part itself, globbing for `*-og.png` to
find the landscape variant and hardcoding 1200 and 630 into the tags, because
nothing has told it what was generated. The partial was taken from two sites
that were each doing this by hand, in 50 and 58 lines respectively.

### What it emits

The same tags [`metaTags`](../configuration/meta-tags/) does, which is the same
job for a site that renders in JavaScript: `og:image` with its width, height and
alt text, and the Twitter pair, with `summary_large_image` for a landscape image
and `summary` for a square one.

### Finding the page

The manifest is keyed by slug, and which slug depends on the
[`slugStrategy`](../configuration/sizes/#slug-strategies) the build used. The
partial tries, in order: a `colophon_key` page parameter, the page's own `slug`,
the route, and the file's base name. So it covers both strategies without being
told which, and `colophon_key` is there for a site whose keys are its own.

### The fallback chain

An explicit `images` parameter on the page wins, then the generated image, then
the site's own `images` parameter. Both are Hugo's existing convention, so a
site that already sets them keeps working. Width, height and alt describe the
generated image, so they are emitted only for that one.

A manifest entry whose image has no URL counts as no image, and falls through to
the site default. That happens when the [placement](../configuration/placement/)
has no `urlBase`, which records dimensions and no address.

### It is yours after that

The file is ejected rather than imported so that the site can change it.
Colophon writes it once and then leaves it alone, so a site that wants a
different fallback chain, or one more tag, edits the file itself.
`colophon eject hugo --force` replaces it, which is worth remembering before
running that.

It needs Hugo 0.156 or newer for `hugo.Data`. On an older Hugo, change the two
references in the file to `site.Data`, which the file itself says.

## Dry runs

```bash
colophon content --config colophon.config.ts --dry-run
```

Reports what a real build would do and writes nothing, neither images nor a
[manifest](../configuration/manifest/):

```text
write content/hello/hello-og.png
skip  content/snippet/snippet-og.png
Dry run: 1 would be written, 1 already up to date. Nothing was written.
```

The plan is built and the stamps are read, so every check a real build makes
still runs: two images written to one path, a manifest two pages would share, a
font file that is not there. A dry run is therefore also how to find out whether
a config would build at all.

Nothing is rendered, so a compromise a template would have reported, such as a
[truncated code snippet](../code-template/), is not reported either. Those come
from rendering, and a dry run does not render.

## Watching

```bash
colophon content --config colophon.config.ts --watch
```

Builds the tree, then builds it again whenever a content file changes, until you
stop it. Only the changed post's images are rendered, since the rest still match
their stamps.

Two things it does not do:

- **A config change is not picked up.** Restart the watch after editing one.
  Reloading a module means importing it again under a fresh URL and leaving the
  old copy behind, and the modules it imports could not be invalidated at all,
  so a template edited in a config file would appear to change nothing.
- **Only content files count.** A change is one to a file with an extension the
  walk reads, which is `.md` and `.markdown` unless
  [`content.extensions`](../configuration/frontmatter/) says otherwise. That is
  what stops the images a build writes next to their posts from triggering the
  next build, and it ignores an editor's own `post.md~` and `.post.md.swp` along
  the way.

A build that fails is reported and the watch carries on, since the mistake is
usually in the file that was just saved.

## The thread pool

`--concurrency` says how many images a build has open at once, and defaults to
one per available CPU. How many of those make progress at a time is a separate
number, and it belongs to Node.

Everything a render spends real time on happens off the main thread. The
rasteriser, the `zlib` calls behind PNG recompression and the `sharp` calls
behind quantising all hand their work to the libuv thread pool. That pool holds
four threads unless `UV_THREADPOOL_SIZE` says otherwise, so on a machine with
more than four cores the default concurrency asks for more than the pool can
serve. The extra images sit in the queue, and the build warns:

```text
colophon: Rendering 18 images at once, but the libuv thread pool has 4
threads. Rasterising, PNG recompression and quantising all run on that pool,
so only 4 renders make progress at a time. Set UV_THREADPOOL_SIZE=18 in the
environment before the process starts to lift the ceiling.
```

Node sizes the pool the first time anything uses it, reading the environment as
it does. By then a build is already running, and setting the variable from
inside the process arrives too late. It has to be in the environment the build
starts in:

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

The curve flattens once the pool is about the size of the machine. That is the
number `--concurrency` already defaults to. Above it the threads compete for
the same cores, and the remaining gains are noise.
