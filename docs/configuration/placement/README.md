# Placement

An output path says where the bytes go and nothing about how anyone reaches
them, which leaves a site to rebuild that mapping in its own templates from
information the build already had. A placement records both the path and the
URL:

```ts
export default defineConfig({
  // Astro, Eleventy, Vite: one directory, served under one prefix.
  placement: { strategy: "public-dir", dir: "public/og", urlBase: "/og" },
});
```

```text
wrote public/og/my-post-og.png -> /og/my-post-og.png
```

## Strategies

| Strategy         | Writes                                | Suits                   |
| ---------------- | ------------------------------------- | ----------------------- |
| `beside-content` | Next to the post, as it always has    | Hugo-style page bundles |
| `public-dir`     | Into `dir`, one directory for the lot | Astro, Eleventy, Vite   |
| `custom`         | Wherever `path` says                  | Anything else           |

For `beside-content` and `public-dir`, one relative path makes both the disk
path and the URL, so the two cannot drift apart. It is held in URL form, with
`/` rather than the platform separator, so a Windows build does not serve
`posts\my-post\a.png`. A `custom` placement names its own path and URL
separately, so it can map them however it needs to.

`beside-content` is the one strategy that needs a content directory, since that
is the root it writes under. A build handed its content through
[`contentFiles`](../../programmatic-use/) can leave `contentDir` out, and then
has to place its images by one of the other two.

## URLs

The URL comes from `urlBase`, prefixed to the image's path under whatever root
placed it. It can be site-relative, such as `/og`, or absolute for images served
from a CDN.

**Without a `urlBase` there is no URL.** A directory on disk does not say how,
or whether, it is served, so a URL Colophon invented would be worse than leaving
the field empty. The reason for writing a URL down is that a site can rely on
it.

Each result carries the URL as `result.url`, which is `undefined` where nothing
says. That covers three cases: no `urlBase`, an image placed by `generate`'s
`outputPath` callback, and an [extra image](../extra-images/) that named its own
path. `outputPath` still takes precedence over a placement, and once it does the
placement no longer describes where the file went.

## Custom placements

`custom` works both halves out itself, for a mapping that is nobody else's.
Images under a dated directory, say:

```ts
placement: {
  strategy: "custom",
  path: (file, size) => `public/og/2026/${file.slug}-${size.name}.png`,
  url: (file, size) => `/og/2026/${file.slug}-${size.name}.png`,
}
```

## Content hashed filenames

Social platforms cache share images aggressively, and they cache by URL, so a
corrected image can keep turning up in feeds for a long time afterwards. Putting
a hash in the filename avoids that:

```ts
placement: { strategy: "public-dir", dir: "public/og", urlBase: "/og", hash: true }
```

```text
wrote public/og/my-post-og.ecd0aab2.png -> /og/my-post-og.ecd0aab2.png
```

Correct the post and the name moves with it, so the URL is one nothing has
cached:

```text
wrote public/og/my-post-og.2e7bd5a9.png -> /og/my-post-og.2e7bd5a9.png
```

The hash is the image's [rebuild stamp](../../rebuilds/), covering its props,
config and size. Hashing the rendered bytes would be a truer name, but they are
not known until the image has been rendered, and not rendering the unchanged
ones is the point of the stamp.

It follows that anything the stamp covers moves the name, including a Colophon
upgrade. Those images are re-rendered by the upgrade anyway, and a fresh URL is
the right answer for an image that may have changed.

Hashing is opt-in for two reasons: the filename then moves whenever the image
does, which not every setup wants, and it leaves the old files behind.

**Nothing deletes them.** That suits a `public-dir` you can rebuild from
scratch, since a crawler holding the old URL still gets an image, but it does
mean a `beside-content` tree slowly accumulates them in your content directory.
The [manifest](../manifest/) always names the current one, so a site never has to
work out which is which.

`custom` has no `hash` option. A placement naming its own paths is the one that
can hash them itself.

## Filename collisions

A flat placement makes collisions much easier to hit. Two posts named `intro.md`
in different sections both want `public/og/intro-og.png`.

Colophon refuses the build and names both posts rather than letting one
overwrite the other. Overwriting would also leave the pair re-rendering on every
build, since each would stamp the same file and neither stamp would ever match
again.

Pair `public-dir` with [`slugStrategy: "route"`](../sizes/#slug-strategies) and
each post keeps its section:

```ts
export default defineConfig({
  content: { slugStrategy: "route" },
  placement: { strategy: "public-dir", dir: "public/og", urlBase: "/og" },
});
// public/og/blog/intro-og.png -> /og/blog/intro-og.png
```

Paths are compared case-insensitively on macOS and Windows, where `Card.png` and
`card.png` are one file.
