import { fromBase64 } from "../platform/base64.js";

/**
 * The bytes behind a `data:` URI, so that an image already inline is measured
 * and checked on the same terms as one read from disk.
 *
 * A prop can carry either, since frontmatter written by hand names a file and
 * frontmatter written by a props mapper may have the image already.
 */
export function bytesFromDataUri(uri: string, label: string): Uint8Array {
  const comma = uri.indexOf(",");
  const head = comma === -1 ? "" : uri.slice(0, comma);
  const body = comma === -1 ? "" : uri.slice(comma + 1);

  if (comma === -1) {
    throw new Error(`${label} is a "data:" URI with no comma in it.`);
  }

  if (head.endsWith(";base64")) {
    return fromBase64(body);
  }

  return new TextEncoder().encode(decodeURIComponent(body));
}
