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
    // `Uint8Array.fromBase64` is not on the oldest Node this package supports.
    // eslint-disable-next-line unicorn/prefer-uint8array-base64
    return Buffer.from(body, "base64");
  }

  return new TextEncoder().encode(decodeURIComponent(body));
}
