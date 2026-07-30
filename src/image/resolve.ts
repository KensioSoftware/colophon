import { resolveReadablePath } from "../platform/read-file.node.js";
import type { ImageSource } from "../types.js";

/**
 * Validate one image source and make its path absolute.
 *
 * Checked when the config is resolved rather than when the image is drawn, for
 * the reason `fonts/resolve.ts` gives: an image that cannot be read is a blank
 * corner on every generated file, and a blank corner does not say which path
 * was wrong.
 */
export function resolveImageSource(
  source: ImageSource,
  label: string,
): ImageSource {
  const raw = source as {
    readonly path?: string;
    readonly data?: Uint8Array;
  };
  const hasPath = raw.path !== undefined;
  const hasData = raw.data !== undefined;

  if (hasPath && hasData) {
    throw new Error(
      `${label} has both "path" and "data"; give one or the other.`,
    );
  }

  if (raw.data !== undefined) {
    if (raw.data.byteLength === 0) {
      throw new Error(`${label} has empty image data.`);
    }

    return source;
  }

  if (raw.path === undefined || raw.path === "") {
    throw new Error(
      `${label} needs a "path" to an image file, or its bytes as "data".`,
    );
  }

  return { path: resolveReadablePath(raw.path, label, "image file") };
}

/** The same for a source that may not be there at all. */
export function resolveOptionalImage(
  source: ImageSource | undefined,
  label: string,
): ImageSource | undefined {
  return source === undefined ? undefined : resolveImageSource(source, label);
}
