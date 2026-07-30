import {
  assertFalse,
  assertIdentical,
  assertStringIncludes,
  assertThrowsErrorAsync,
  assertTrue,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import {
  signParams,
  signedQuery,
  verifyParams,
  verifySignedQuery,
} from "./sign/index.js";

const secret = "a secret the site keeps";
const params = { title: "Hello", template: "card" };

describe("signParams", () => {
  it("accepts the signature it produced", async () => {
    const signature = await signParams(params, secret);

    assertTrue(await verifyParams(params, signature, secret));
  });

  it("does not depend on the order the parameters arrive in", async () => {
    // A query string means the same thing whatever order it is written in, and
    // a proxy is free to tidy one.
    assertIdentical(
      await signParams({ title: "Hello", template: "card" }, secret),
      await signParams({ template: "card", title: "Hello" }, secret),
    );
  });

  it("refuses a signature for different parameters", async () => {
    const signature = await signParams(params, secret);

    assertFalse(
      await verifyParams(
        { ...params, title: "Something else" },
        signature,
        secret,
      ),
    );
  });

  it("refuses a signature made with a different secret", async () => {
    const signature = await signParams(params, "someone else's secret");

    assertFalse(await verifyParams(params, signature, secret));
  });

  it("refuses a signature that is not a signature at all", async () => {
    // Whatever arrives in the URL is a stranger's, so it has to be safe to
    // hand anything at all to the check.
    assertFalse(await verifyParams(params, "!!! not base64 !!!", secret));
    assertFalse(await verifyParams(params, "", secret));
  });

  it("cannot be fooled by moving an ampersand into a value", async () => {
    // The usual way a scheme like this breaks: two different parameter sets
    // that serialise to the same string.
    const signature = await signParams({ a: "1&b=2", b: "3" }, secret);

    assertFalse(await verifyParams({ a: "1", b: "2&b=3" }, signature, secret));
  });
});

describe("signedQuery", () => {
  it("produces a query string its own check accepts", async () => {
    const query = await signedQuery(params, secret);

    assertStringIncludes(query, "title=Hello");
    assertTrue(await verifySignedQuery(new URLSearchParams(query), secret));
  });

  it("rejects a query string whose parameters were edited", async () => {
    const query = await signedQuery(params, secret);
    const tampered = new URLSearchParams(query);
    tampered.set("title", "Free advertising");

    assertFalse(await verifySignedQuery(tampered, secret));
  });

  it("rejects a query string carrying no signature", async () => {
    assertFalse(await verifySignedQuery(new URLSearchParams(params), secret));
  });

  it("rejects a query string that repeats a parameter", async () => {
    // The attack this exists to stop. `URLSearchParams.get` takes the first
    // value and building an object from the pairs takes the last, so a handler
    // reading "Evil" could otherwise be handed a signature made for "Good".
    const signed = await signedQuery({ title: "Good" }, secret);
    const injected = new URLSearchParams(`title=Evil&${signed}`);

    assertIdentical(injected.get("title"), "Evil");
    assertFalse(await verifySignedQuery(injected, secret));
  });

  it("rejects a query string that repeats the signature", async () => {
    const signed = await signedQuery({ title: "Good" }, secret);

    assertFalse(
      await verifySignedQuery(new URLSearchParams(`${signed}&s=other`), secret),
    );
  });
});

describe("the signature parameter as an input", () => {
  it("refuses to sign parameters that include it", async () => {
    // Dropping it quietly would sign something other than what was passed, and
    // `signedQuery` would then put two of them in one URL.
    const error = await assertThrowsErrorAsync(async () =>
      signParams({ title: "Hello", s: "mine" }, secret),
    );

    assertStringIncludes(error.message, "cannot be one of the parameters");
  });

  it("refuses to build a query from them either", async () => {
    await assertThrowsErrorAsync(async () =>
      signedQuery({ title: "Hello", s: "mine" }, secret),
    );
  });
});

describe("key ordering", () => {
  it("does not depend on the runtime's collation", async () => {
    // Keys are sorted by code unit, not by `localeCompare`, which puts "ä"
    // before "z" under `en` and after it under `sv`. A signature is a protocol
    // between two machines, so the answer cannot depend on either one's locale.
    //
    // Pinned to a known value rather than compared with itself, since that is
    // what says the bytes signed are the ones this was written to sign. It
    // fails if the sort, the escaping or the digest ever changes, which for a
    // wire format is the point.
    assertIdentical(
      await signParams({ z: "1", "\u{E4}": "2" }, secret),
      // A test vector rather than a secret: the signature of two known
      // parameters under the secret at the top of this file.
      // eslint-disable-next-line no-secrets/no-secrets
      "_Bmn_XwjwMZL8muQqvcgoHAzVnY055a7g6TWQ1NerEw",
    );
  });
});
