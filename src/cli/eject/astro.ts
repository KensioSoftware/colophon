/**
 * The Astro component `colophon eject astro` writes.
 *
 * Ejected rather than exported, for the reason the Hugo partial is: a `<head>`
 * is something a site owns. A shipped component would also be a `.astro` file
 * in the published package, which nothing in this build compiles or typechecks,
 * and which would then have to be kept working across Astro versions.
 *
 * The route is mapped to a manifest key by `metaTagsForPath`, which is in the
 * package and tested there, so what is ejected stays small enough to read.
 */
export const astroComponent = `---
/**
 * Social meta tags for the current route, from the images Colophon generated.
 *
 * Use it in your layout's <head>:
 *
 *     <ColophonMeta />
 *
 * The manifest import path is where the config's \`manifest\` option points.
 * The cast is because a JSON import types "version" as number rather than as
 * the literal 1 the Manifest type asks for.
 */
import { metaTagsForPath } from "@kensio/colophon/meta";
import type { Manifest } from "@kensio/colophon";
import manifest from "../data/colophon.json";

const tags = metaTagsForPath(manifest as Manifest, Astro.url.pathname, {
  baseUrl: Astro.site?.href,
});
---

{tags.map((tag) => <meta {...tag} />)}
`;
