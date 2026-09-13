---
description: Control where Colophon writes images and which public URLs appear in the manifest.
---

# Placement

Placement controls where Colophon writes images and which URLs it records for
them. Use `public-dir` to collect images in a directory served by your site:

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

`beside-content` and `public-dir` derive the disk path and URL from the same
relative path. URLs use `/` separators on every platform. With `custom`, your
function supplies the path and URL separately.

`beside-content` requires `contentDir`. If you supply
[`contentFiles`](../../programmatic-use/) without a content directory, use
`public-dir` or `custom`.

## URLs

For built-in strategies, `urlBase` is prefixed to the image's relative path.
Use a site-relative prefix such as `/og` or an absolute URL for a CDN.

Without `urlBase`, built-in placements record only the disk path.

Generated results expose the URL as `result.url`. It is `undefined` when no
`urlBase` is set, when `generate.outputPath` chooses the path, or when an
[extra image](../extra-images/) supplies its own output path. The `outputPath`
callback takes precedence over placement settings.

## Custom placements

Use a `custom` placement function to compute both the output path and URL.
This example places images in a dated directory:

```ts
placement: {
  strategy: "custom",
  path: (file, size) => `public/og/2026/${file.slug}-${size.name}.png`,
  url: (file, size) => `/og/2026/${file.slug}-${size.name}.png`,
}
```

## Content hashed filenames

Set `hash: true` to include a rebuild hash in each image's filename. Changed
images then get new URLs, which helps avoid stale social platform caches:

```ts
placement: { strategy: "public-dir", dir: "public/og", urlBase: "/og", hash: true }
```

```text
wrote public/og/my-post-og.ecd0aab2.png -> /og/my-post-og.ecd0aab2.png
```

When an image's inputs change, its filename changes:

```text
wrote public/og/my-post-og.2e7bd5a9.png -> /og/my-post-og.2e7bd5a9.png
```

The hash comes from the image's [rebuild stamp](../../rebuilds/). It covers
the rendering inputs and can be computed before rendering. It is not a hash
of the finished file's bytes.

Changes covered by the stamp update the filename, including changes to
Colophon's rendering code or dependencies during an upgrade.

Hashing is disabled by default. Enabling it creates a new file whenever the
stamp changes.

Colophon keeps old image files. This preserves existing URLs but can accumulate
files, especially with `beside-content`. Rebuild the output directory from
scratch when you want to remove old images. The [manifest](../manifest/)
always points to the current filenames.

A `custom` placement has no `hash` option. Its function controls the filename.

## Filename collisions

Two posts can produce the same filename when their slugs match. For example,
two files named `intro.md` in different sections both produce
`public/og/intro-og.png` under a flat public directory.

Colophon checks output paths before rendering and stops the build if two
images would share a path. The error names both posts.

Use [`slugStrategy: "route"`](../sizes/#slug-strategies) with `public-dir`
to retain each post's section in its filename:

```ts
export default defineConfig({
  content: { slugStrategy: "route" },
  placement: { strategy: "public-dir", dir: "public/og", urlBase: "/og" },
});
// public/og/blog/intro-og.png -> /og/blog/intro-og.png
```

On macOS and Windows, collision checks treat paths as case-insensitive.
`Card.png` and `card.png` count as the same path.
