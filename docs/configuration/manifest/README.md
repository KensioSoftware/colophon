---
description: Use the Colophon JSON manifest to look up generated image URLs and dimensions by page.
---

# Manifest

A manifest is a JSON file listing each page's generated images and dimensions.
Set `manifest` to the path your site will read:

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

Hugo reads JSON from `data/`, Astro can import it, and Eleventy and Jekyll
read `_data/`. Zola provides `load_data`. Your site can look up each image's
URL and dimensions in the manifest:

```ts
const page = manifest.pages["blog/my-post"];
const image = page.images[page.widest];
// <meta property="og:image" content={image.url}>
// <meta property="og:image:width" content={image.width}>
```

Use [`metaTags`](../meta-tags/) to generate image meta tags from these entries.

## What is in it

- Pages are keyed by slug. With
  [`slugStrategy: "route"`](../sizes/#slug-strategies), the key is the page's
  route. Duplicate keys cause a build error.
- `widest` identifies the size with the highest width-to-height ratio. A tie
  uses the size configured first. This selects the landscape variant even
  when it has the same pixel width as a square variant.
- `url` comes from [placement](../placement/) and is omitted if no URL is
  available. Dimensions are always included.
- `alt` comes from the image props' title and is omitted if there is no title.
- [Extra images](../extra-images/) are excluded because they have no page slug.

## What it describes

Every build writes a complete manifest, including images skipped because
their rebuild stamps match. It describes the full set of current images.

The manifest is prepared from the build plan. Duplicate slugs are detected
before images are rendered.

Pages and sizes are sorted, and the JSON is indented for readable diffs.
