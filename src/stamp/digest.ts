import { createHash } from "node:crypto";

/** SHA-256 of a string or buffer, as hex. */
export function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * `JSON.stringify` with object keys sorted, so that reordering frontmatter
 * without changing it does not look like a change.
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, raw: unknown) =>
    isRecord(raw)
      ? Object.fromEntries(
          Object.keys(raw)
            .toSorted((a, b) => a.localeCompare(b))
            .map((key) => [key, raw[key]]),
        )
      : raw,
  );
}
