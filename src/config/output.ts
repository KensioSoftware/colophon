import { DEFAULT_QUALITY } from "./defaults.js";

/**
 * The settings for how a finished picture is encoded, checked here rather than
 * in `validate/`, which checks keys and the names of closed sets.
 *
 * They are in a file of their own rather than beside the other resolvers
 * because `resolve.ts` is already close enough to the FTA threshold that the
 * next thing added to it would push it over.
 */

/**
 * Encoding quality, `1` to `100`.
 *
 * Out of range is rejected rather than clamped, for the reason
 * `compressionLevel` is: a config asking for `120` has something in mind that
 * no encoder here can give it, and quietly encoding at `100` would leave
 * somebody believing they had asked for more than they had.
 */
export function resolveQuality(quality: number | undefined): number {
  if (quality === undefined) {
    return DEFAULT_QUALITY;
  }

  if (!Number.isSafeInteger(quality) || quality < 1 || quality > 100) {
    throw new Error(
      `Invalid quality ${String(quality)}; expected a whole number from 1` +
        ` (smallest) to 100 (best).`,
    );
  }

  return quality;
}

/**
 * The cap on one image, in bytes, or `undefined` for none.
 *
 * A cap of zero or less can never be met, so it is a mistake rather than a very
 * strict setting: every image would be written at the lowest quality there is
 * and every one of them would be reported as too big.
 */
export function resolveMaxBytes(
  maxBytes: number | undefined,
): number | undefined {
  if (maxBytes === undefined) {
    return undefined;
  }

  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new Error(
      `Invalid maxBytes ${String(maxBytes)}; expected a whole number of bytes` +
        ` above zero, such as 5_000_000 for X's 5MB limit.`,
    );
  }

  return maxBytes;
}
