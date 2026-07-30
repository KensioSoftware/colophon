/**
 * Signing the parameters of an image request.
 *
 * Rendering on demand means an endpoint that turns a query string into a
 * picture, and an endpoint like that is an open image generator for anyone who
 * finds it: they choose the text, your domain serves it, and your bill pays for
 * it. Signing is what makes the URLs your own, since only the site holding the
 * secret can produce one the endpoint will answer.
 *
 * It uses Web Crypto, which is the one HMAC available everywhere this is meant
 * to run: browsers, workers, and Node since 18.
 */

import { fromBase64Url, toBase64Url } from "./base64url.js";

/**
 * The parameters of one request, which are what the signature covers.
 */
export type SignedParams = Readonly<Record<string, string>>;

/** The parameter a signature travels in, chosen to be short and unremarkable. */
export const signatureParam = "s";

/**
 * Order two keys the same way everywhere.
 *
 * By code unit rather than `localeCompare`, which is what the rest of this
 * package sorts with. That is for people reading a list; this is a protocol,
 * and the two ends of it are usually two different machines. `localeCompare`
 * puts "ä" before "z" under `en` and after it under `sv`, so a URL signed by a
 * build could be refused by the edge that serves it.
 */
function byCodeUnit(a: string, b: string): number {
  if (a === b) {
    return 0;
  }

  return a < b ? -1 : 1;
}

/**
 * The exact bytes signed, so that signing and verifying agree.
 *
 * Sorted, because a query string means the same thing whatever order it arrives
 * in, and a signature that did not would fail on a URL a proxy had tidied.
 * `URLSearchParams` does the escaping, so a value containing an `&` cannot be
 * read as two parameters, which is the way a scheme like this is usually
 * broken.
 */
// `Uint8Array<ArrayBuffer>` rather than the default `ArrayBufferLike`, which
// Web Crypto will not take: it cannot work on a shared buffer.
function canonical(params: SignedParams): Uint8Array<ArrayBuffer> {
  const search = new URLSearchParams();

  for (const key of Object.keys(params).toSorted(byCodeUnit)) {
    search.append(key, params[key] ?? "");
  }

  return new TextEncoder().encode(search.toString());
}

/**
 * Refuse a parameter set that carries the signature parameter itself.
 *
 * Dropping it quietly would sign something other than what the caller passed,
 * and `signedQuery` would then put two of them in one URL. Neither is a thing
 * to guess about, and a caller in that position has made a mistake worth being
 * told about.
 */
function assertSignable(params: SignedParams): void {
  if (Object.hasOwn(params, signatureParam)) {
    throw new Error(
      `"${signatureParam}" is the parameter the signature itself travels in,` +
        ` so it cannot be one of the parameters being signed. Rename it.`,
    );
  }
}

/** The secret as a key Web Crypto will sign or verify with, and nothing else. */
async function hmacKey(
  secret: string,
  use: "sign" | "verify",
): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [use],
  );
}

/**
 * The signature for a set of parameters.
 *
 * Everything that must not be tampered with has to be in `params`: the
 * signature covers those and nothing else, so a template name or a size left
 * outside them is a template name or a size anyone can change.
 */
export async function signParams(
  params: SignedParams,
  secret: string,
): Promise<string> {
  assertSignable(params);

  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret, "sign"),
    canonical(params),
  );

  return toBase64Url(new Uint8Array(signature));
}

/**
 * Whether a signature is the one these parameters should carry.
 *
 * The comparison is `crypto.subtle.verify` rather than one of two strings,
 * because a comparison that stops at the first wrong byte tells an attacker how
 * much of a guess was right.
 */
export async function verifyParams(
  params: SignedParams,
  signature: string,
  secret: string,
): Promise<boolean> {
  try {
    return await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret, "verify"),
      fromBase64Url(signature),
      canonical(params),
    );
  } catch {
    // A signature that is not base64url at all is simply a wrong one.
    return false;
  }
}

/** The query string for a set of parameters, with its signature appended. */
export async function signedQuery(
  params: SignedParams,
  secret: string,
): Promise<string> {
  assertSignable(params);

  const search = new URLSearchParams(params);
  search.append(signatureParam, await signParams(params, secret));

  return search.toString();
}

/**
 * Check a request's own query string, which is the shape the check takes in a
 * route handler: everything but the signature is what was signed.
 *
 * A repeated parameter is refused rather than resolved. A query string may
 * carry the same key twice, and the two ends then disagree about which one it
 * means: `URLSearchParams.get` takes the first, and building an object from the
 * pairs takes the last. An attacker appending their own copy of a key to a URL
 * that was signed for the other value is the whole attack this exists to stop,
 * and no honest signed URL repeats a key.
 */
export async function verifySignedQuery(
  search: URLSearchParams,
  secret: string,
): Promise<boolean> {
  const params: Record<string, string> = {};
  let signature: string | undefined;

  for (const [key, value] of search) {
    if (key === signatureParam) {
      if (signature !== undefined) {
        return false;
      }

      signature = value;
      continue;
    }

    if (Object.hasOwn(params, key)) {
      return false;
    }

    params[key] = value;
  }

  return signature === undefined
    ? false
    : verifyParams(params, signature, secret);
}
