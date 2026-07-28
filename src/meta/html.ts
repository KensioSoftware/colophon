import { escapeXml } from "../text/escape.js";
import type { Manifest, MetaTag, MetaTagOptions } from "../types.js";
import { metaTags } from "./tags.js";

/** One tag as HTML, with whichever naming attribute it carries. */
function toHtml(tag: MetaTag): string {
  const [attribute, name] =
    "property" in tag ? ["property", tag.property] : ["name", tag.name];

  return `<meta ${attribute}="${escapeXml(name)}" content="${escapeXml(tag.content)}">`;
}

/**
 * The social meta tags for one page, rendered as HTML.
 *
 * The same tags as {@link metaTags}, for a template that writes strings rather
 * than a component that spreads attributes. Content is escaped: alt text comes
 * from a post's title, and a title containing an apostrophe or an ampersand is
 * ordinary rather than exotic.
 *
 * Newline-separated and with no trailing newline, so it drops into a `<head>`
 * at whatever indentation the template is already using.
 */
export function metaTagsHtml(
  manifest: Manifest,
  slug: string,
  options?: MetaTagOptions,
): string {
  return metaTags(manifest, slug, options)
    .map((tag) => toHtml(tag))
    .join("\n");
}
