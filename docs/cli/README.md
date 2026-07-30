# The command line

```text
colophon [contentDir] [options]    Render the images for a content tree
colophon init [contentDir]         Write a starter config module
colophon preview <file> [options]  Render one post and open it
```

| Option                | What it does                                                                       |
| --------------------- | ---------------------------------------------------------------------------------- |
| `-c`, `--config` path | Load a config module, whose default export is a config or a function returning it  |
| `-f`, `--force`       | Re-render every image, ignoring the stamps. For `init`, replace an existing config |
| `-o`, `--overwrite`   | Alias for `--force`                                                                |
| `-n`, `--dry-run`     | Report what would change and write nothing                                         |
| `-w`, `--watch`       | Rebuild whenever a content file changes                                            |
| `--concurrency` n     | How many images to render at once. Defaults to one per available CPU               |
| `--size` name         | Which configured size `preview` renders. Defaults to the first one                 |
| `-h`, `--help`        | Show the help text                                                                 |

The first argument is read as a command only where it names one, so a content
directory called `init` or `preview` has to be written as `./init`. Everything
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

Renders that one post and opens the image, which is what tuning a template, a
palette or a code snippet wants: the alternative is running the whole build and
picking the one image out of it that was the point.

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
file: in a build the same post is simply skipped.

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
