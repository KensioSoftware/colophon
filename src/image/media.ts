/** The image formats a build can draw with. */
export type MediaType =
  "image/png" | "image/jpeg" | "image/gif" | "image/webp" | "image/svg+xml";

function hasSignature(
  bytes: Uint8Array,
  signature: readonly number[],
): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}

/** Whether the bytes at `offset` spell `text` in ASCII. */
function hasAscii(bytes: Uint8Array, offset: number, text: string): boolean {
  return Array.from(
    text,
    (character, index) => [character, index] as const,
  ).every(
    ([character, index]) => bytes[offset + index] === character.codePointAt(0),
  );
}

/**
 * The format of some bytes, read from the bytes themselves rather than from
 * the file extension. A file named `.png` that is really a JPEG renders either
 * way once the `data:` URI says what it is, and a rename is not the sort of
 * thing a build should fail over.
 */
export function sniffMediaType(bytes: Uint8Array): MediaType | undefined {
  if (hasSignature(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }

  if (hasSignature(bytes, [0xff, 0xd8, 0xff])) {
    return "image/jpeg";
  }

  if (hasAscii(bytes, 0, "GIF8")) {
    return "image/gif";
  }

  if (hasAscii(bytes, 0, "RIFF") && hasAscii(bytes, 8, "WEBP")) {
    return "image/webp";
  }

  return isSvg(bytes) ? "image/svg+xml" : undefined;
}

/**
 * SVG is text, so it has no signature to match. Look for the opening tag in
 * the first stretch of the file, past any declaration, doctype or comment.
 */
function isSvg(bytes: Uint8Array): boolean {
  const head = new TextDecoder().decode(bytes.slice(0, 1024));
  return /<svg[\s>]/i.test(head);
}
