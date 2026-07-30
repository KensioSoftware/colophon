# Astro

Two halves: an integration that renders the images during the build, and a
component that emits the tags for the route being rendered.

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

It takes the same options as [`generate`](../programmatic-use/), so `config` is
an ordinary [Colophon config](../configuration/). Give it a
[`manifest`](../configuration/manifest/) path, since that is what the component
reads, and a [`placement`](../configuration/placement/) with a `urlBase`, since
a tag needs an address rather than a path on disk.

Nothing is imported from `astro`, so the integration does not pin you to a
version of it.

### When it runs

On `astro:config:setup`, which is the one hook that fires for `astro dev` as
well as `astro build`, and which runs before anything is rendered. Both matter:
the manifest has to exist before a page that reads it is built, and a dev server
should show the images the build will produce rather than the last build's.

Running on every dev start sounds expensive and is not. The
[rebuild stamps](../rebuilds/) mean a second run reads the content tree,
compares digests and renders no images. It does rewrite the manifest, which is
a small JSON file describing what is already there.

A build that cannot render fails the Astro build rather than warning, because
the alternative is a site shipping pages whose tags point at images that were
never written.

## The component

```bash
colophon eject astro
```

writes `src/components/ColophonMeta.astro`, which you use in your layout:

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

It is written into your site rather than imported from the package, because a
`<head>` is something a site owns: adding `og:title`, changing the fallback, or
dropping a tag should be an edit rather than a feature request. `colophon eject
astro --force` replaces it.

The component is thin, because the part worth testing is in the package:

```astro
const tags = metaTagsForPath(manifest as Manifest, Astro.url.pathname, {
  baseUrl: Astro.site?.href,
});
```

The cast is there because a JSON import types `version` as `number` rather than
as the literal `1` the `Manifest` type asks for.

## Finding the page

`metaTagsForPath` maps the route to a manifest key, which is the one fiddly part
of any integration. The manifest is keyed by slug, and which slug depends on the
[`slugStrategy`](../configuration/sizes/#slug-strategies) the build used, so both
are tried: the whole path first, then its last segment. A page at `/blog/hello`
finds a `blog/hello` key under `route` and a `hello` key under `basename`,
without being told which the build wrote.

A route no key matches gets no tags, exactly as an unknown slug does. Not every
page has a share image, and a layout cannot know which in advance.

It is exported from `@kensio/colophon/meta` and is not Astro-specific: any
framework that knows the path it is rendering can use it.

## Content collections

`contentDir` is a directory of files, so point it at the collection's directory
under `src/content/`. Colophon walks the tree itself and reads the frontmatter
with [its own options](../configuration/frontmatter/), rather than going through
Astro's collection API, which keeps the integration a wrapper around `generate`
and nothing more.
