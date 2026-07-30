/**
 * What to print when something has gone wrong. A stack trace is noise for the
 * mistakes this CLI reports, which are nearly all a bad path, a bad flag or a
 * config that does not add up.
 */
export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
