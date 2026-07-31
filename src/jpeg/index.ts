/**
 * Reading the JPEG container itself, as against the picture in it.
 *
 * The counterpart of `png/`, and here for the same reason: two things in the
 * package have to walk a JPEG's segments, the size reader that a template draws
 * a logo from and the rebuild stamp that a build writes into a comment.
 */
export type { JpegSegment } from "./segments.js";
export { jpegSegments } from "./segments.js";
