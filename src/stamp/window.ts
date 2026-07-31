/**
 * How close to one end of a file a stamp has to sit.
 *
 * A build reads this much and stops, at the front for a carrier that writes
 * near the header and at the back for one that appends, so deciding to skip an
 * image never means reading the whole of it. Both halves need the number: the
 * reader to know how much to take, and a carrier that chooses where to write to
 * keep inside it.
 */
export const stampWindow = 4096;
