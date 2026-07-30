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

/**
 * The parameters of one request, which are what the signature covers.
 */
export type SignedParams = Readonly<Record<string, string>>;

/** The parameter a signature travels in, chosen to be short and unremarkable. */
export const signatureParam = "s";

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
  const keys = Object.keys(params).toSorted((a, b) => a.localeCompare(b));

  for (const key of keys) {
    if (key !== signatureParam) {
      search.append(key, params[key] ?? "");
    }
  }

  return new TextEncoder().encode(search.toString());
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

/** Base64url, which is what a signature has to be to live in a URL. */
function toBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }

  // `Uint8Array#toBase64` is not on the oldest Node this package supports, and
  // would want its `base64url` alphabet anyway.
  // eslint-disable-next-line unicorn/prefer-uint8array-base64
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const padded = text.replaceAll("-", "+").replaceAll("_", "/");

  // eslint-disable-next-line unicorn/prefer-uint8array-base64
  return Uint8Array.from(atob(padded), (c) => c.codePointAt(0) ?? 0);
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
  const search = new URLSearchParams(params);
  search.append(signatureParam, await signParams(params, secret));

  return search.toString();
}

/**
 * Check a request's own query string, which is the shape the check takes in a
 * route handler: everything but the signature is what was signed.
 */
export async function verifySignedQuery(
  search: URLSearchParams,
  secret: string,
): Promise<boolean> {
  const signature = search.get(signatureParam);

  if (signature === null) {
    return false;
  }

  const params: Record<string, string> = {};

  for (const [key, value] of search) {
    if (key !== signatureParam) {
      params[key] = value;
    }
  }

  return verifyParams(params, signature, secret);
}
