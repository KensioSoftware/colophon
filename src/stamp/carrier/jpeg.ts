import { jpegSegments } from "../../jpeg/segments.js";
import { stampFromPayload } from "../payload.js";
import { stampWindow } from "../window.js";
import type { StampCarrier } from "./types.js";

/** The comment marker, which is where the stamp goes. */
const comment = 0xfe;

/** The most a segment can carry: its two-byte length counts itself. */
const maxPayload = 0xff_ff - 2;

/** An application segment, `APP0` through `APP15`. */
function isApplication(marker: number): boolean {
  return marker >= 0xe0 && marker <= 0xef;
}

function isJpeg(head: Buffer): boolean {
  return (
    head.length >= 3 && head.readUInt8(0) === 0xff && head.readUInt8(1) === 0xd8
  );
}

/**
 * Where a comment of `length` bytes goes: after the start-of-image marker, and
 * past whatever application segments come first.
 *
 * Both JFIF and Exif want their own `APPn` to be the first thing after `SOI`.
 * A comment written ahead of one leaves a file that still decodes but whose
 * metadata a strict reader no longer finds, which is a needless thing for a
 * rebuild stamp to cost.
 *
 * It has to end inside the window the stamp is read back through, though, and
 * that wins where the two disagree: an embedded colour profile can run to tens
 * of kilobytes, and a stamp written past it would be a stamp no later build
 * ever finds, leaving the image to render again every time and nothing to say
 * why. So the last segment boundary with room for the comment is where it goes,
 * and failing every one of them, straight after `SOI`.
 */
function insertionPoint(jpeg: Buffer, length: number): number {
  let offset = 2;

  for (const segment of jpegSegments(jpeg)) {
    if (!isApplication(segment.marker) || segment.end + length > stampWindow) {
      break;
    }

    offset = segment.end;
  }

  return offset;
}

function write(jpeg: Buffer, payload: Buffer): Buffer {
  if (payload.length > maxPayload) {
    throw new Error(
      `Cannot stamp: the stamp needs ${String(payload.length)} bytes and a` +
        ` JPEG comment holds ${String(maxPayload)}.`,
    );
  }

  const segment = Buffer.alloc(4 + payload.length);

  segment.writeUInt8(0xff, 0);
  segment.writeUInt8(comment, 1);
  segment.writeUInt16BE(payload.length + 2, 2);
  payload.copy(segment, 4);

  const at = insertionPoint(jpeg, segment.length);
  return Buffer.concat([jpeg.subarray(0, at), segment, jpeg.subarray(at)]);
}

function read(head: Buffer): string | undefined {
  for (const { marker, start, end, truncated } of jpegSegments(head)) {
    // Half a comment is half a stamp, which would never match anything but is
    // not the sort of thing to hand back and hope.
    if (marker !== comment || truncated) {
      continue;
    }

    const stamp = stampFromPayload(head.subarray(start, end));

    if (stamp !== undefined) {
      return stamp;
    }
  }

  return undefined;
}

/** JPEG, where the stamp is a `COM` segment among the ones before the scan. */
export const jpegCarrier: StampCarrier = {
  format: "JPEG",
  end: "head",
  matches: isJpeg,
  write,
  read,
};
