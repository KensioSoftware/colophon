import type { Manifest, MetaTag, MetaTagOptions } from "../types.js";
import { metaTags } from "./tags.js";

/**
 * The manifest keys a URL path might be under, likeliest first.
 *
 * A framework that renders routes knows the path it is rendering and not the
 * content file behind it, so the key has to be worked back out of the address.
 * Which key a build wrote depends on its `slugStrategy`: `route` gives the
 * path itself, and `basename` gives only the last segment. Both are tried, more
 * specific first, so one call covers either without being told which was used.
 *
 * The site root is `index`, which is what `slugFromPath` calls a root-level
 * `index.*` for the same reason: there is no directory name to fall back on.
 */
export function slugCandidates(pathname: string): readonly string[] {
  const trimmed = pathname.replaceAll(/^\/+|\/+$/g, "");

  if (trimmed === "") {
    return ["index"];
  }

  const last = trimmed.slice(trimmed.lastIndexOf("/") + 1);

  return last === trimmed ? [trimmed] : [trimmed, last];
}

/**
 * The social meta tags for the page at a URL path, rather than for a slug.
 *
 * This is {@link metaTags} for a site that has a route and needs the key,
 * which is every framework that renders pages from URLs. A path no key matches
 * gets no tags, exactly as an unknown slug does: not every page has a share
 * image, and a layout emitting tags cannot know which in advance.
 */
export function metaTagsForPath(
  manifest: Manifest,
  pathname: string,
  options?: MetaTagOptions,
): readonly MetaTag[] {
  for (const slug of slugCandidates(pathname)) {
    // Own keys only. A manifest is parsed JSON, so it inherits `toString` and
    // the rest of `Object.prototype`, and a plain lookup would take a page at
    // `/toString` for a hit and then fail on it.
    if (Object.hasOwn(manifest.pages, slug)) {
      return metaTags(manifest, slug, options);
    }
  }

  return [];
}
