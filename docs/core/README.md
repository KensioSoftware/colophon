# The browser-safe core

`buildSvg` is string building: props, a config and a size go in, an SVG document
comes out. Everything in this package that needs Node is on one side of it or
the other, so the middle can run in a browser, in a worker, or in a request
handler.

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

It is the same code the root entry point runs. Imported from Node it behaves
identically; imported into a bundle it swaps two modules, through
`package.json`'s `browser` field, for versions that cannot touch a filesystem or
a native binary.

## Frontmatter, without a content tree

Finding posts needs a filesystem, but understanding one does not. `extractProps`
takes a parsed frontmatter object and returns the props a template renders from,
so something handed a post rather than going and looking for one gets the same
reading of `meta_img_props` that a build does:

```js
import { extractProps } from "@kensio/colophon/core";

const props = extractProps(frontmatter, { defaultTemplate: "card" });
```

It returns `undefined` for a post that should not have an image, which is the
same signal the [`props` mapper](../configuration/frontmatter/) gives. The rest
of the content layer — walking a tree, reading files, deriving slugs — is on
`@kensio/colophon/content` and stays in Node.

## Problems, rather than an exception

`resolveConfig` validates what it is given and throws, which is what a build
wants: there is nowhere to put a problem but the end of the run. Somewhere with
a place to put them, such as an editor rendering a config as it is typed, wants
the list instead:

```js
import { configProblems } from "@kensio/colophon/core";

for (const problem of configProblems(config)) {
  // 'Unknown option "colors.forground". Did you mean "foreground"?'
}
```

An empty array means the config is one `resolveConfig` will accept.

## Two things it cannot do

**Fonts and images have to be bytes.** There is no filesystem to resolve a path
against, so `{ data }` works and `{ path }` does not. It says so when the config
is resolved rather than later:

```text
fonts[0]: cannot read the font file at "./Inter.ttf" here, since there is no
filesystem. Supply the bytes as "data" instead.
```

**There is no rasteriser.** resvg is a native module, so a browser build does
not include it, and nothing here turns the SVG into pixels. Two ways on:

- Take the SVG. Browsers draw it, and it is often what you wanted anyway.
- Set [`config.rasteriser`](../configuration/rasteriser/) to something that runs
  where you are. A wasm build of resvg is the obvious one, and that seam already
  exists. It returns a `Uint8Array`, so a backend with no `Buffer` to hand back
  is not a problem.

Asking for pixels without one is an error rather than a blank image.

## What it weighs

About 10 MB bundled, of which 9.5 MB is [Shiki](https://shiki.style)'s grammars
and themes. The templates, the layout toolkit and the measuring are the
remaining half a megabyte.

That is the price of the `code` template rendering any language in any theme. A
build that does not need it, or needs two languages rather than every language,
should use Shiki's own fine-grained bundle to narrow what is included.

## Themes on a site that already highlights code

Colophon resolves `code.theme` through a registry of its own rather than through
Shiki's. That looks like duplication, so it is worth saying why it is there.

A tool that highlights a site's own code blocks may narrow what Shiki bundles by
rewriting Shiki's modules during the build. [Expressive
Code](https://expressive-code.com), which a
[Starlight](https://starlight.astro.build) site runs by default, does that under
an option called `removeUnusedThemes`: it strips every theme from Shiki's theme
module except the ones its own configuration names. The rewrite applies to the
file rather than to whichever importer asked for it, so a second Shiki caller in
the same build, which is what Colophon is on a site rendering images in the
browser, was left with no themes at all and rejected every theme name, the
default included.

Owning the registry is what makes that irrelevant, and there is nothing to
configure. Languages are still Shiki's, so a site that has narrowed those the
same way through `shiki.bundledLangs` will find a language Colophon does not
have falls back to plain text, which is what an unrecognised language has always
done.

Emitting [meta tags](../configuration/meta-tags/) needs none of this: the
`@kensio/colophon/meta` subpath bundles to about 4 KB and depends on nothing.

## Rendering on demand

An endpoint that turns a query string into an image is an open image generator
for anyone who finds it: they pick the words, your domain serves them, and your
bill pays for it. Sign the parameters.

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

The signature covers the parameters and nothing else, so anything that must not
be tampered with has to be one of them: a template name or a size left outside
is a template name or a size anyone can change. It is HMAC-SHA256 over the
parameters sorted by name, so the order they arrive in does not matter, and the
check is `crypto.subtle.verify` rather than a string comparison that would stop
at the first wrong byte.

A query string that repeats a parameter is refused rather than resolved.
`URLSearchParams.get` takes the first value of a repeated key and building an
object from the pairs takes the last, so appending a second copy of a key to a
signed URL is how a check like this is got round. No honest signed URL repeats
one.

`signParams` and `verifyParams` are there for a URL shape of your own.

### On a Cloudflare Worker

The same handler, with the two things a worker does differently: the font is
imported as bytes rather than read, and the secret comes from the environment.

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

Caching matters more here than in a build: a signed URL is stable, so the
`immutable` header above means each image is rendered once per edge location
rather than once per request.

## Building images at build time

None of this replaces the [CLI](../cli/) or
[`generate`](../programmatic-use/). Rendering at build time is cheaper, cached
by the [rebuild stamps](../rebuilds/), and produces files a CDN serves without
running anything. On-demand rendering is for pages that do not exist until
somebody asks for them.
