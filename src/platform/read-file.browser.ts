/**
 * The browser and edge stand-in for reading a file, which is to say there is no
 * reading a file.
 *
 * A bundler picks this up through `package.json`'s `browser` field. Supplying
 * a font or an image as a path is the one thing the core cannot do, since there
 * is no filesystem to resolve it against, so it says so rather than failing
 * later as a missing glyph or a blank image.
 */
export function readFileBytes(path: string): Promise<Uint8Array> {
  return Promise.reject(
    new Error(
      `Cannot read "${path}": there is no filesystem here. Supply fonts and` +
        ` images as bytes ({ data }) rather than as paths ({ path }).`,
    ),
  );
}

/**
 * The same, and the same answer: a path names a file, and there are none here.
 * Refused when the config is resolved rather than when the image is drawn, so
 * that a config which cannot work here says so before anything renders.
 */
export function resolveReadablePath(
  given: string,
  label: string,
  kind: string,
): string {
  throw new Error(
    `${label}: cannot read the ${kind} at "${given}" here, since there is no` +
      ` filesystem. Supply the bytes as "data" instead.`,
  );
}
