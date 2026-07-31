import { MINIMUM_QUALITY, QUALITY_STEP } from "../config/defaults.js";

/**
 * Encode at `quality`, and again lower, until the result is under `maxBytes` or
 * quality has nowhere left to go.
 *
 * Stepping down in fixed increments rather than searching for the highest
 * quality that fits is the deliberate choice. Each step costs a whole encoding,
 * a search would cost several more of them for a difference nobody can see, and
 * a step is a number somebody can predict from the one they configured.
 *
 * The floor is where a picture stops being worth having, so an image that will
 * not fit even there is returned as it is. Saying so is `warnIfOverCap`'s job:
 * the cap is a request, and refusing to write an image because it could not be
 * met would be a build that failed over a file size.
 */
export async function fitToBytes(
  encode: (quality: number) => Promise<Buffer>,
  quality: number,
  maxBytes: number,
): Promise<Buffer> {
  const image = await encode(quality);
  const next = quality - QUALITY_STEP;

  return image.length <= maxBytes || next < MINIMUM_QUALITY
    ? image
    : fitToBytes(encode, next, maxBytes);
}
