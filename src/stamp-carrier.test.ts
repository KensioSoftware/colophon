import {
  assertBufferEqual,
  assertIdentical,
  assertStringIncludes,
  assertThrowsError,
  assertUndefined,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { carrierFor } from "./stamp/carrier/index.js";
import { stampImage } from "./stamp/index.js";

const stamp = "a".repeat(64);

/**
 * Round-trip one container: the stamp reads back, and everything the file said
 * before it was stamped it still says. The window a tail carrier reads from is
 * the whole file here, since these fixtures are far shorter than one.
 */
function assertRoundTrip(image: Buffer): Buffer {
  const carrier = carrierFor(image);

  if (carrier === undefined) {
    throw new Error("no carrier matched the fixture");
  }

  const stamped = stampImage(image, stamp);

  assertIdentical(carrier.read(stamped), stamp);
  assertUndefined(carrier.read(image));
  return stamped;
}

/** Where the `APP0` ends and the rest of the file begins. */
const afterApp0 = 20;

/**
 * SOI, a JFIF `APP0` of 20 bytes, a 64x48 baseline frame header, then a scan
 * of one byte and the end-of-image marker.
 */
function jpeg(): Buffer {
  return Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x0b,
    0x08, 0x00, 0x30, 0x00, 0x40, 0x01, 0x01, 0x11, 0x00, 0xff, 0xda, 0x00,
    0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x7f, 0xff, 0xd9,
  ]);
}

/** A comment segment carrying `text`, for putting somewhere it should not be. */
function jpegComment(text: string): Buffer {
  const segment = Buffer.alloc(4 + text.length);

  segment.writeUInt8(0xff, 0);
  segment.writeUInt8(0xfe, 1);
  segment.writeUInt16BE(text.length + 2, 2);
  segment.write(text, 4, "latin1");
  return segment;
}

/** The fixture with `segment` where the stamp's own comment would go. */
function withComment(segment: Buffer): Buffer {
  return Buffer.concat([
    jpeg().subarray(0, afterApp0),
    segment,
    jpeg().subarray(afterApp0),
  ]);
}

/** A RIFF file holding one `VP8 ` chunk of `size` bytes. */
function webp(size = 8): Buffer {
  const file = Buffer.alloc(20 + size);

  file.write("RIFF", 0, "latin1");
  file.writeUInt32LE(file.length - 8, 4);
  file.write("WEBP", 8, "latin1");
  file.write("VP8 ", 12, "latin1");
  file.writeUInt32LE(size, 16);
  file.fill(0x2a, 20);
  return file;
}

/** An `ftyp` box declaring AVIF, then an `mdat` box holding the picture. */
function avif(size = 8): Buffer {
  const file = Buffer.alloc(20 + size);

  file.writeUInt32BE(12, 0);
  file.write("ftypavif", 4, "latin1");
  file.writeUInt32BE(8 + size, 12);
  file.write("mdat", 16, "latin1");
  file.fill(0x2a, 20);
  return file;
}

describe("the JPEG carrier", () => {
  it("round-trips a stamp through a comment segment", () => {
    const stamped = assertRoundTrip(jpeg());

    // The comment goes after the `APP0`, which both JFIF and Exif want to be
    // the first thing in the file, and before everything else.
    const rest = jpeg().length - afterApp0;

    assertBufferEqual(
      stamped.subarray(0, afterApp0),
      jpeg().subarray(0, afterApp0),
    );
    assertIdentical(stamped.readUInt16BE(afterApp0), 0xff_fe);
    assertBufferEqual(stamped.subarray(-rest), jpeg().subarray(afterApp0));
  });

  it("refuses a stamp longer than a comment segment holds", () => {
    const error = assertThrowsError(() => {
      stampImage(jpeg(), "a".repeat(70_000));
    });

    assertStringIncludes(error.message, "a JPEG comment holds 65533");
  });

  it("stops reading at the start of the scan", () => {
    // Entropy-coded data follows `SOS`, and bytes of it that happen to spell a
    // marker would otherwise be read as one.
    const scan = Buffer.concat([jpeg(), jpegComment(`colophon\u{0}${stamp}`)]);

    assertUndefined(carrierFor(scan)?.read(scan));
  });

  it("stops reading at a segment declaring an impossible length", () => {
    // A length counts its own two bytes, so one under that says the next
    // segment starts before this one's header ends.
    const broken = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x01, 0x00, 0x00,
    ]);

    assertUndefined(carrierFor(broken)?.read(broken));
  });

  it("reads only as far as the bytes it was given reach", () => {
    // The head of a large file is a window, so its last segment is often cut
    // off, and a stamp read out of half a comment would be half a stamp.
    const stamped = stampImage(jpeg(), stamp);

    assertUndefined(carrierFor(stamped)?.read(stamped.subarray(0, 60)));
  });

  it("ignores a comment carrying no keyword at all", () => {
    const file = withComment(jpegComment("hey"));

    assertUndefined(carrierFor(file)?.read(file));
  });

  it("ignores a comment that is somebody else's", () => {
    const file = withComment(jpegComment("rendered by hand"));

    assertIdentical(carrierFor(file)?.read(stampImage(file, stamp)), stamp);
  });
});

describe("the WebP carrier", () => {
  it("round-trips a stamp through a chunk on the end", () => {
    const stamped = assertRoundTrip(webp());

    // Everything the file already held past the RIFF length, and then the
    // stamp chunk: appending is the only place libwebp tolerates one in a
    // plain WebP.
    assertBufferEqual(stamped.subarray(8, 28), webp().subarray(8));
    assertIdentical(stamped.toString("latin1", 28, 32), "CLPH");
  });

  it("brings the RIFF length up to match", () => {
    const stamped = stampImage(webp(), stamp);

    assertIdentical(stamped.readUInt32LE(4), stamped.length - 8);
  });

  it("pads an odd payload without counting the padding", () => {
    const stamped = stampImage(webp(), "odd");

    // `colophon`, a separator and three characters is twelve bytes.
    assertIdentical(stamped.readUInt32LE(32), 12);
    assertIdentical(stamped.length % 2, 0);
  });

  it("ignores the keyword turning up in the image data", () => {
    const file = webp(16);

    file.write("colophon", 20, "latin1");
    assertUndefined(carrierFor(file)?.read(file));
  });

  it("ignores a chunk claiming more bytes than the window holds", () => {
    const stamped = stampImage(webp(), stamp);

    stamped.writeUInt32LE(9999, 32);
    assertUndefined(carrierFor(stamped)?.read(stamped));
  });
});

describe("the AVIF carrier", () => {
  it("round-trips a stamp through a uuid box on the end", () => {
    const stamped = assertRoundTrip(avif());

    // `mdat` locates the picture by its offset from the start of the file, so
    // nothing may be inserted in front of it.
    assertBufferEqual(stamped.subarray(0, 28), avif());
    assertIdentical(stamped.toString("latin1", 32, 36), "uuid");
  });

  it("states the size of the whole box, header and all", () => {
    const stamped = stampImage(avif(), stamp);

    assertIdentical(stamped.readUInt32BE(28), stamped.length - 28);
  });

  it("ignores the keyword turning up in the image data", () => {
    const file = avif(16);

    file.write("colophon", 20, "latin1");
    assertUndefined(carrierFor(file)?.read(file));
  });

  it("ignores a box claiming more bytes than the window holds", () => {
    const stamped = stampImage(avif(), stamp);

    stamped.writeUInt32BE(9999, 28);
    assertUndefined(carrierFor(stamped)?.read(stamped));
  });
});

describe("carrierFor", () => {
  it("says nothing for a format none of the carriers knows", () => {
    assertUndefined(carrierFor(Buffer.from("GIF89a and then some pixels")));
  });

  it("names the formats it does know when refusing to stamp", () => {
    const error = assertThrowsError(() => {
      stampImage(
        Buffer.from("not an image, but long enough to look at"),
        stamp,
      );
    });

    assertStringIncludes(
      error.message,
      "Cannot stamp: unrecognised image format.",
    );
    assertStringIncludes(error.message, "PNG, JPEG, WebP, AVIF");
  });
});
