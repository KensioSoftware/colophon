---
description: Generate Open Graph and Twitter image tags from a Colophon manifest.
---

# Social meta tags

Use `metaTagsHtml` to generate Open Graph and Twitter image tags from a
[manifest](../manifest/):

```ts
import { metaTags, metaTagsHtml } from "@kensio/colophon/meta";
import manifest from "./data/colophon.json";

const site = { baseUrl: "https://example.com" };

metaTagsHtml(manifest, "blog/my-post", site);
```

```html
<meta
  property="og:image"
  content="https://example.com/og/blog/my-post-og.png"
/>
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="My post" />
<meta name="twitter:card" content="summary_large_image" />
<meta
  name="twitter:image"
  content="https://example.com/og/blog/my-post-og.png"
/>
<meta name="twitter:image:alt" content="My post" />
```

`metaTags` returns tag objects for use in a component. Open Graph tags use
`property`, and Twitter tags use `name`. Both can be spread into a `<meta>`
element:

```jsx
const slug = "blog/my-post";
{
  metaTags(manifest, slug, site).map((tag) => <meta {...tag} />);
}
```

<a id="what-it-decides-for-you"></a>

## Image selection and URLs

- `twitter:card` is `summary_large_image` when the widest image has an aspect
  ratio of at least 1.5:1. Otherwise, it is `summary`.
- `baseUrl` resolves relative image URLs to absolute URLs for social crawlers.
  An image URL that is already absolute is kept unchanged.
- Alt text is emitted as both `og:image:alt` and `twitter:image:alt`.

## Pages without an image

For a slug missing from the manifest, `metaTags` returns an empty array and
`metaTagsHtml` returns an empty string.

This lets a shared layout handle posts skipped by a
[props mapper](../frontmatter/) as well as posts with generated images.

An entry whose image has no URL causes an error. Check `placement.urlBase`
if this happens.

## Import it from the subpath

Import these functions from `@kensio/colophon/meta`. This subpath loads the
metadata helpers without loading the rasteriser or syntax highlighter.

<a id="tags-for-a-route-rather-than-a-slug"></a>

## Looking up a route

Use `metaTagsForPath` when your framework provides the current page's URL
path:

```ts
import { metaTagsForPath } from "@kensio/colophon/meta";

const tags = metaTagsForPath(manifest, "/blog/my-post/", site);
```

The function tries the full path as a manifest key, then its last segment.
This supports both [slug strategies](../sizes/#slug-strategies). If neither
matches, it returns no tags. The [Astro component](../../astro/) uses this
function.

<a id="sites-that-do-not-run-javascript"></a>

## Hugo sites

For Hugo, run `colophon eject hugo` to write a Go template partial that reads
the manifest and emits image tags. See
[the command line](../../cli/#colophon-eject).
