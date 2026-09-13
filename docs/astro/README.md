---
description: Generate social images during an Astro build and add the image tags to each page.
---

# Astro

The Astro integration generates images before pages are built. A separate
component adds the image meta tags to each page. Configure both as shown below.

## The integration

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import colophon from "@kensio/colophon/astro";

export default defineConfig({
  site: "https://example.com",
  integrations: [
    colophon({
      contentDir: "src/content",
      config: {
        colors: { brand: "#0d9488" },
        footer: "example.com",
        placement: { strategy: "public-dir", dir: "public/og", urlBase: "/og" },
        manifest: "src/data/colophon.json",
      },
    }),
  ],
});
```

The integration accepts the same options as [`generate`](../programmatic-use/),
including a [Colophon config](../configuration/). Set a
[`manifest`](../configuration/manifest/) path for the component to read. Set
[`placement.urlBase`](../configuration/placement/) to give images public URLs.

The integration has no runtime dependency on the `astro` package.

### When it runs

The integration runs during `astro:config:setup` for both `astro dev` and
`astro build`. Images and the manifest are ready before Astro renders pages.

On later runs, [rebuild stamps](../rebuilds/) let Colophon skip unchanged
images. The manifest is rewritten to describe the current images.

An image generation error stops the Astro build.

## The component

```bash
colophon eject astro
```

This writes `src/components/ColophonMeta.astro`. Add it to your layout's
`<head>`:

```astro
---
import ColophonMeta from "../components/ColophonMeta.astro";
---
<html>
  <head>
    <ColophonMeta />
  </head>
</html>
```

You can edit this component to add tags such as `og:title` or change the
fallback behaviour. `colophon eject astro --force` overwrites the component.

The component uses `metaTagsForPath` to look up the current route:

```astro
const tags = metaTagsForPath(manifest as Manifest, Astro.url.pathname, {
  baseUrl: Astro.site?.href,
});
```

The `Manifest` cast is needed because TypeScript infers a JSON import's
`version` field as `number`. The manifest type requires the literal `1`.

## Finding the page

`metaTagsForPath` tries the full route as a manifest key, then the route's last
segment. For `/blog/hello`, it tries `blog/hello` and then `hello`. This supports
both [slug strategies](../configuration/sizes/#slug-strategies) automatically.

If neither key matches, the component emits no image tags for that page.

Any framework can use `metaTagsForPath` from `@kensio/colophon/meta` if it has
the current page's path.

## Content collections

Point `contentDir` at the collection's files under `src/content/`. Colophon
reads files directly using its [frontmatter settings](../configuration/frontmatter/).
It does not use Astro's content collection API.
