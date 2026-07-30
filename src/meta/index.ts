/**
 * Social meta tags, built from the manifest a build wrote.
 *
 * Importable on its own as `@kensio/colophon/meta`: emitting tags reads a JSON
 * file and needs none of the rendering machinery, and a site's templates
 * should not load a rasteriser and a syntax highlighter to write a `<head>`.
 */
export { metaTagsHtml } from "./html.js";
export { metaTagsForPath, slugCandidates } from "./path.js";
export { metaTags } from "./tags.js";
export { absoluteUrl } from "./url.js";
