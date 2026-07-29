# Social meta tags

Generating the image is half the job. The site still has to write the tags, and
every site ends up with slightly different results.

Given [a manifest](../manifest/), that is a lookup:

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

`metaTags` returns the same set as objects, for a component that spreads them.
Open Graph names its tags with `property` and Twitter with `name`, so the type
keeps the two apart and `<meta {...tag} />` is right either way:

```jsx
const slug = "blog/my-post";
{
  metaTags(manifest, slug, site).map((tag) => <meta {...tag} />);
}
```

## What it decides for you

- **The card type follows the image.** `summary_large_image` when the page's
  widest image is at least 1.5:1, which the 1.91:1 Open Graph landscape and the
  2:1 Twitter size both clear, and `summary` otherwise, since a square shown as
  a large card is cropped. Sites usually hardcode whichever answer suited the
  image they had at the time.
- **`baseUrl` makes the URL absolute**, which Open Graph needs. A crawler reads
  the tag out of the page and has nothing to resolve a relative URL against. A
  URL that is already absolute, from a CDN `urlBase`, is left alone.
- **Alt text goes to both platforms.** Twitter reads `twitter:image:alt` rather
  than falling back to the Open Graph one, so emitting only the latter means no
  alt text where most of the sharing happens.

## Pages without an image

A slug the manifest does not hold returns an empty array, or an empty string
from `metaTagsHtml`, rather than throwing.

Not every page has a share image. Returning `undefined` from a
[props mapper](../frontmatter/) is how a site says so, and a template asking for
tags cannot know which pages those are in advance.

A page whose image has no URL does throw, because that is a config that forgot
`placement.urlBase` rather than a page that opted out.

## Import it from the subpath

Import from `@kensio/colophon/meta` rather than the package root. Emitting tags
reads a JSON file, and a site's templates should not have to load a rasteriser
and a syntax highlighter to write a `<head>`.
