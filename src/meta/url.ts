/**
 * A URL that names its own scheme. Schemes are case-insensitive, so `HTTPS://`
 * is as absolute as `https://` and prefixing it would produce nonsense.
 */
const schemed = /^[a-z][a-z\d+.-]*:\/\//i;

/** The scheme a base URL is served over, `https:` included. */
function schemeOf(url: string): string | undefined {
  return /^[a-z][a-z\d+.-]*:/i.exec(url)?.[0];
}

/**
 * Resolve an image URL against the site's base.
 *
 * Open Graph wants an absolute URL: a crawler reads the tag out of the page
 * and has nothing to resolve a relative one against. A manifest holds whatever
 * the placement's `urlBase` said, which is usually site-relative, so this is
 * where the two halves meet.
 *
 * A URL that names its own scheme is returned untouched — a placement pointing
 * at a CDN has said everything there is to say. A scheme-relative one (`//cdn`)
 * has not: it is relative to the page's scheme, which is exactly what a crawler
 * reading the tag elsewhere does not have, so it borrows the base's.
 */
export function absoluteUrl(url: string, baseUrl: string | undefined): string {
  if (baseUrl === undefined || schemed.test(url)) {
    return url;
  }

  if (url.startsWith("//")) {
    const scheme = schemeOf(baseUrl);
    return scheme === undefined ? url : `${scheme}${url}`;
  }

  const base = baseUrl.replace(/\/+$/, "");

  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
}
