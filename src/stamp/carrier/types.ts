/**
 * One image container the rebuild stamp can be written into and read back out
 * of again.
 */
export interface StampCarrier {
  /** What to call the container in a message. */
  readonly format: string;
  /**
   * Which end of the file the stamp is written to, and so read back from.
   *
   * PNG and JPEG both define a place near the front for a note in text, so the
   * stamp goes there and a build decides whether to skip a file having read
   * only its head. RIFF and ISO base media have no such place, and both keep
   * offsets that inserting bytes ahead of the image data would move, so the
   * stamp is appended and the window comes off the end instead.
   */
  readonly end: "head" | "tail";
  /** Whether the leading bytes of a file are this container. */
  matches(head: Buffer): boolean;
  /** `image` with `payload` embedded, leaving every pixel of it alone. */
  write(image: Buffer, payload: Buffer): Buffer;
  /** The stamp in a window taken from this carrier's `end`, if it is there. */
  read(window: Buffer): string | undefined;
}
