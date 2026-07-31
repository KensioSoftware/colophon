import { carrierFor, carrierFormats } from "./carrier/index.js";
import { stampPayload } from "./payload.js";

/**
 * Return `image` with `stamp` embedded, so that the build after this one can
 * read it back and leave the file alone.
 *
 * The stamp goes inside the image rather than into a file beside it, which is
 * what keeps the two from parting company: an image carries its stamp when it
 * is copied, and loses it when it is deleted or rewritten by something else,
 * both of which are the answer a build wants.
 *
 * Nothing about the picture changes. A PNG gains a `tEXt` chunk and a JPEG a
 * `COM` segment, both among the metadata before the image data; a WebP gains a
 * chunk and an AVIF a `uuid` box, both on the end, since those two locate their
 * picture by an offset that inserting bytes earlier would move.
 *
 * A format none of the carriers knows throws rather than being written
 * unstamped, because an image no build can ever skip is a worse thing to hand
 * back quietly than an error naming what went wrong. Reachable only through a
 * configured rasteriser, since resvg writes PNG and nothing else.
 */
export function stampImage(image: Buffer, stamp: string): Buffer {
  const carrier = carrierFor(image);

  if (carrier === undefined) {
    throw new Error(
      "Cannot stamp: unrecognised image format. The rebuild stamp goes inside" +
        " the image, so a rasteriser has to produce one of" +
        ` ${carrierFormats()} for a build to be able to skip it.`,
    );
  }

  return carrier.write(image, stampPayload(stamp));
}
