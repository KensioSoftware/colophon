import {
  assertFalse,
  assertIdentical,
  assertStringIncludes,
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
});
