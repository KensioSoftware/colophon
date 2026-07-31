/** One segment of a JPEG: its marker, and where the payload after it sits. */
export interface JpegSegment {
  /** The byte after the `0xff`, such as `0xc0` for a baseline frame header. */
  readonly marker: number;
  /** First byte of the payload, past the two-byte length. */
  readonly start: number;
  /** One past the payload's last byte, or past the buffer where it is cut. */
  readonly end: number;
  /**
   * Whether the segment reaches past the end of the buffer, so that what is
   * between `start` and `end` is only the head of it. The two readers here want
   * different things from that: a frame header states the size in its first few
   * bytes and is worth reading anyway, while half a comment is half a stamp.
   */
  readonly truncated: boolean;
}

/** Markers that carry no payload, so nothing follows them to skip over. */
const standalone = new Set([0xd8, 0xd9, 0x01]);

/** Start of scan. Entropy-coded data follows it, which is not segments. */
const startOfScan = 0xda;

/**
 * The segments of a JPEG in file order, from just after the start-of-image
 * marker to the start of the scan.
 *
 * Unlike a PNG, a JPEG states nothing at a fixed offset: the frame header comes
 * after however many comment, quantisation and application segments the encoder
 * felt like writing, and finding one means walking them all. Two things here
 * need that walk, reading the size of an image and reading the rebuild stamp
 * out of a comment, and writing it twice is how the two would come to disagree.
 *
 * Reading stops rather than skipping where a segment runs past the end of
 * `bytes`, which covers a truncated file and a window holding only the head of
 * one alike: past that point there is nothing further to be sure of.
 */
export function* jpegSegments(bytes: Uint8Array): Generator<JpegSegment> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;

  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      // Anything between segments is skipped a byte at a time rather than
      // read as a length, since a length taken from the middle of one would
      // jump somewhere arbitrary.
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1] ?? 0;

    if (marker === 0xff) {
      // A marker may be preceded by any number of `0xff` fill bytes, so this
      // is the first of them rather than a marker of its own.
      offset += 1;
      continue;
    }

    if (standalone.has(marker)) {
      offset += 2;
      continue;
    }

    if (marker === startOfScan) {
      return;
    }

    // The length counts its own two bytes, so anything under two is a file
    // saying its next segment starts before this one's header ends.
    const length = view.getUint16(offset + 2);

    if (length < 2) {
      return;
    }

    const declared = offset + 2 + length;
    const isTruncated = declared > bytes.length;

    // A segment reaching past the end is the last one there is anything to
    // read: what is there of it is yielded, and then reading stops.
    yield {
      marker,
      start: offset + 4,
      end: isTruncated ? bytes.length : declared,
      truncated: isTruncated,
    };

    if (isTruncated) {
      return;
    }

    offset = declared;
  }
}
