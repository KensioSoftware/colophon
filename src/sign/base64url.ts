import { fromBase64, toBase64 } from "../platform/base64.js";

/**
 * Base64url, which is what a signature has to be to travel in a URL.
 *
 * It is ordinary base64 with two characters swapped and the padding dropped,
 * so the encoding itself comes from `platform/base64.ts` and this is only the
 * alphabet. `+`, `/` and `=` all mean something in a query string, and a
 * signature carrying them would depend on every proxy between the two ends
 * escaping them the same way.
 */
export function toBase64Url(bytes: Uint8Array): string {
  return toBase64(bytes)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

/**
 * The reverse. The padding `toBase64Url` dropped is not needed to decode, since
 * the length of the input says where the bytes end.
 */
export function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  return fromBase64(text.replaceAll("-", "+").replaceAll("_", "/"));
}
