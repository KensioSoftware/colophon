/**
 * Base64 for bytes, without `Buffer`.
 *
 * `Buffer` is Node's, and an image is inlined into the SVG as a `data:` URI
 * wherever this runs. `btoa` is the encoder every environment in scope has:
 * browsers, workers, and Node since 16. `Uint8Array#toBase64` would read better
 * and is not on the oldest Node this package supports.
 */

/**
 * How many bytes to convert per call.
 *
 * `String.fromCodePoint` takes the bytes as arguments, and an image is large
 * enough that passing them all at once would overflow the argument limit.
 */
const chunkSize = 0x80_00;

/** Encode bytes, for the `data:` URI an inlined image is drawn from. */
export function toBase64(bytes: Uint8Array): string {
  let binary = "";

  for (let at = 0; at < bytes.length; at += chunkSize) {
    binary += String.fromCodePoint(...bytes.subarray(at, at + chunkSize));
  }

  // `Uint8Array#toBase64` is not on the oldest Node this package supports.
  // eslint-disable-next-line unicorn/prefer-uint8array-base64
  return btoa(binary);
}

/** Decode it again, for a `data:` URI that arrived carrying its payload. */
// `Uint8Array<ArrayBuffer>` rather than the default `ArrayBufferLike`: Web
// Crypto will not take a possibly-shared buffer, and a signature is decoded
// straight into it.
export function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  // eslint-disable-next-line unicorn/prefer-uint8array-base64
  const binary = atob(text);

  return Uint8Array.from(binary, (character) => character.codePointAt(0) ?? 0);
}
