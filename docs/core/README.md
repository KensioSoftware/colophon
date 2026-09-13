---
description: Render Colophon images as SVG in a browser or worker with the browser-safe core API.
---

# The browser-safe core

Import `@kensio/colophon/core` to build SVG images in a browser, worker or
request handler. `buildSvg` takes image props, resolved config and dimensions,
and returns an SVG string:

```js
import { buildSvg, resolveConfig } from "@kensio/colophon/core";

const config = resolveConfig({
  colors: { brand: "#0d9488" },
  fonts: [{ family: "Inter", data: fontBytes }],
});

const svg = await buildSvg(
  { template: "card", title: "Rendered anywhere" },
  config,
  { width: 1200, height: 630 },
);
```

The core uses the same rendering code as the Node entry point. When bundled
for a browser, the package's `browser` field replaces modules that use the
filesystem or native binaries with browser versions.

<a id="frontmatter-without-a-content-tree"></a>

## Reading frontmatter

Use `extractProps` when you already have a parsed frontmatter object. It
applies the same props rules as a content build:

```js
import { extractProps } from "@kensio/colophon/core";

const props = extractProps(frontmatter, { defaultTemplate: "card" });
```

`extractProps` returns `undefined` when the post should be skipped, as a
[props mapper](../configuration/frontmatter/) does. To read files or walk a
directory in Node, use `@kensio/colophon/content`.

<a id="problems-rather-than-an-exception"></a>

## Validating config

`resolveConfig` throws on invalid config. For an editor or live preview, use
`configProblems` to get a list of validation messages:

```js
import { configProblems } from "@kensio/colophon/core";

for (const problem of configProblems(config)) {
  // 'Unknown option "colors.forground". Did you mean "foreground"?'
}
```

An empty array means the config is one `resolveConfig` will accept.

<a id="two-things-it-cannot-do"></a>

## Browser requirements

Supply fonts and images as bytes with `{ data }`. Browser config cannot load
filesystem paths. Using `{ path }` causes a config error:

```text
fonts[0]: cannot read the font file at "./Inter.ttf" here, since there is no
filesystem. Supply the bytes as "data" instead.
```

Browser bundles omit the bundled font files. Supply font bytes to measure
text accurately. Without them, Colophon estimates character widths and the
host chooses the fonts used to display the SVG.

The browser bundle also omits the native resvg rasteriser. You can use the
SVG directly or supply a browser-compatible renderer:

- Display the SVG in the browser or pass it to another service.
- Supply [`config.rasteriser`](../configuration/rasteriser/) with a renderer
  such as resvg compiled to WebAssembly. It must return a `Uint8Array`.

Requesting raster output without a compatible rasteriser causes an error.

<a id="what-it-weighs"></a>

## Bundle size

A measured browser bundle was about 10 MB. [Shiki](https://shiki.style)
grammars and themes accounted for about 9.5 MB, with the remaining 0.5 MB used
by rendering and layout code.

The code template can load many languages and themes. Bundle size depends on
your build tool and which Shiki resources it includes.

## Themes on a site that already highlights code

Colophon uses its own registry for `code.theme`. It continues to work when a
site's code highlighter removes unused Shiki themes.

For example, [Expressive Code](https://expressive-code.com), used by
[Starlight](https://starlight.astro.build), can rewrite Shiki's theme module
through `removeUnusedThemes`. This leaves Colophon's theme registry intact.

Languages still come from Shiki. If `shiki.bundledLangs` excludes a language,
Colophon renders snippets in that language as plain text.

If you only need [meta tags](../configuration/meta-tags/), import
`@kensio/colophon/meta`. That subpath has no dependencies and measured about
4 KB bundled.

## Rendering on demand

For a public image endpoint, sign the query parameters before including the
URL in a page. Verify the signature before rendering. Create signatures on
the server or at build time, and keep the secret out of browser code.

```js
import { signedQuery } from "@kensio/colophon/core";

// In the page, where the secret lives:
const query = await signedQuery({ title: post.title }, SECRET);
const url = `https://example.com/og?${query}`;
```

```js
// In the handler:
import {
  buildSvg,
  resolveConfig,
  verifySignedQuery,
} from "@kensio/colophon/core";

export default async function handler(request) {
  const { searchParams } = new URL(request.url);

  if (!(await verifySignedQuery(searchParams, SECRET))) {
    return new Response("Not found", { status: 404 });
  }

  const svg = await buildSvg(
    { template: "card", title: searchParams.get("title") ?? "" },
    resolveConfig({ fonts: [{ family: "Inter", data: await fontBytes() }] }),
    { width: 1200, height: 630 },
  );

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
```

The signature covers the supplied parameters, sorted by name, using
HMAC-SHA256. Parameter order in the URL does not matter. Include every
user-controlled rendering option, such as template or size, in the signed
parameters. Verification uses `crypto.subtle.verify`.

Duplicate query parameters are rejected. Different URL parsers can select
different values for repeated keys, so accepting them would make signature
verification ambiguous.

Use `signParams` and `verifyParams` when building your own signed URL format.

### On a Cloudflare Worker

In a Cloudflare Worker, import the font as bytes and read the secret from the
Worker environment:

```js
import fontData from "./Inter.ttf";

export default {
  async fetch(request, env) {
    const { searchParams } = new URL(request.url);

    if (!(await verifySignedQuery(searchParams, env.COLOPHON_SECRET))) {
      return new Response("Not found", { status: 404 });
    }
    // ...as above, with `fonts: [{ family: "Inter", data: new Uint8Array(fontData) }]`
  },
};
```

`wrangler.toml` needs a rule to import the font as bytes:

```toml
rules = [{ type = "Data", globs = ["**/*.ttf"] }]
```

The response's `Cache-Control` header allows clients to reuse the image. To
cache generated responses at Cloudflare's edge, configure caching or use
[the Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/).
The example above does not add responses to the edge cache. Keep every
rendering input in the cache key, and change the URL when the image changes.

## Building images at build time

Use the [CLI](../cli/) or [`generate`](../programmatic-use/) for images you
can create during a build. They produce static files and skip unchanged images
using [rebuild stamps](../rebuilds/). Use on-demand rendering when image inputs
are available only at request time.
