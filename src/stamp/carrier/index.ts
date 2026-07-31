import { isobmffCarrier } from "./isobmff.js";
import { jpegCarrier } from "./jpeg.js";
import { pngCarrier } from "./png.js";
import { riffCarrier } from "./riff.js";
import type { StampCarrier } from "./types.js";

export type { StampCarrier } from "./types.js";

/**
 * Every container a stamp can go into, tried in the order they are written.
 *
 * Each one owns its own signature as well as its reading and writing, so the
 * package has no second opinion about what a file is: `image/media.ts` sniffs
 * the formats a build can _draw_ with, which is a different list arrived at for
 * a different reason, and neither should be made to answer for the other.
 */
const carriers: readonly StampCarrier[] = [
  pngCarrier,
  jpegCarrier,
  riffCarrier,
  isobmffCarrier,
];

/** The carrier for these bytes, read from their signature. */
export function carrierFor(head: Buffer): StampCarrier | undefined {
  return carriers.find((carrier) => carrier.matches(head));
}

/** What the containers are called, for the message when none of them fits. */
export function carrierFormats(): string {
  return carriers.map(({ format }) => format).join(", ");
}
