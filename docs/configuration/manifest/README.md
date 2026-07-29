# Manifest

Colophon writes PNGs and then goes quiet, so the site works out for itself what
was generated, where it lives and how big it is. That usually means globbing for
`*-og.png` to find the landscape variant, or hardcoding 1200 and 630 into the
meta tags.

All of it is known while generating. Point `manifest` at a file and it is
written down:

```ts
export default defineConfig({
  placement: { strategy: "public-dir", dir: "public/og", urlBase: "/og" },
  manifest: "data/colophon.json", // src/data/ for Astro, _data/ for Eleventy
});
```

```json
{
  "version": 1,
  "pages": {
    "blog/my-post": {
      "images": {
        "og": {
          "url": "/og/blog/my-post-og.png",
          "width": 1200,
          "height": 630
        },
        "square": {
          "url": "/og/blog/my-post-square.png",
          "width": 1200,
          "height": 1200
        }
      },
      "widest": "og",
      "alt": "My post"
    }
  }
}
```

Every generator in scope reads JSON as native data. Hugo picks it up from
`data/`, Astro imports it, Eleventy and Jekyll read `_data/`, and Zola has
`load_data`. That makes the meta tags a lookup rather than a convention:

```ts
const page = manifest.pages["blog/my-post"];
const image = page.images[page.widest];
// <meta property="og:image" content={image.url}>
// <meta property="og:image:width" content={image.width}>
```

[`metaTags`](../meta-tags/) will do that part for you.

## What is in it

- **Pages are keyed by slug**, which is what the site addresses a page by, and
  under [`slugStrategy: "route"`](../sizes/#slug-strategies) is the route
  itself. Two pages cannot share a key, and a build that would need them to
  fails saying so, because a lookup returning the wrong post's image is worse
  than no manifest at all.
- **`widest`** names the most landscape image by aspect ratio, ties going to the
  size configured first. It is what a `summary_large_image` card wants, and the
  check every site currently writes for itself. Note that og (1200x630) and
  square (1200x1200) are equally wide, so comparing widths would pick either.
- **`url`** is absent where the placement knows none. See
  [Placement](../placement/). The dimensions are always there.
- **`alt`** comes from the props' title, and is absent for a page without one.
- **[Extra images](../extra-images/) are not pages**, so they are not listed. A
  project that named the output path of one already knows where it is.

## What it describes

The manifest describes what exists, not what a given run did. A rebuild that
skips every image still writes the whole thing, so a build over an unchanged
tree still produces a complete record of the site.

It is built from the planned work rather than the results, which is also why a
duplicate slug fails before the tree is rendered rather than after.

Pages and sizes are sorted and the JSON is indented, so a manifest committed to
a repository changes only when the build does.
