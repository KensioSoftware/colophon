/** Whether a URL already says which host it is on. */
function isAbsolute(url: string): boolean {
  return (
    url.startsWith("https://") ||
    url.startsWith("http://") ||
    url.startsWith("//")
  );
}

/**
 * Resolve an image URL against the site's base.
 *
 * Open Graph wants an absolute URL: a crawler reads the tag out of the page
 * and has nothing to resolve a relative one against. A manifest holds whatever
 * the placement's `urlBase` said, which is usually site-relative, so this is
 * where the two halves meet.
 *
 * A URL that is already absolute is returned untouched — a placement pointing
 * at a CDN has said everything there is to say.
 */
export function absoluteUrl(url: string, baseUrl: string | undefined): string {
  if (baseUrl === undefined || isAbsolute(url)) {
    return url;
  }

  const base = baseUrl.replace(/\/+$/, "");

  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
}
