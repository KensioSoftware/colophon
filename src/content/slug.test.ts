import path from "node:path";

import { assertIdentical, assertStringNotIncludes } from "@kensio/smartass";
import { describe, it } from "vitest";

import { slugFromPath } from "./slug.js";

describe("slugFromPath", () => {
  it("uses the parent directory for index files", () => {
    assertIdentical(
      slugFromPath(path.join("blog", "my-post", "index.md")),
      "my-post",
    );
  });

  it("uses the filename for non-index files", () => {
    assertIdentical(slugFromPath(path.join("blog", "my-post.md")), "my-post");
  });

  it("names a root-level index file after itself", () => {
    // There is no parent directory inside the tree to borrow a name from, and
    // borrowing the content directory's would put the walk root in the slug.
    assertIdentical(slugFromPath("index.md"), "index");
  });

  it("keeps the directories under the route strategy", () => {
    assertIdentical(
      slugFromPath(path.join("services", "iam", "index.md"), "route"),
      "services/iam",
    );
    assertIdentical(
      slugFromPath(path.join("blog", "my-post.md"), "route"),
      "blog/my-post",
    );
  });

  it("names the root page index under the route strategy", () => {
    // The one page with no directory to be named after.
    assertIdentical(slugFromPath("index.md", "route"), "index");
  });

  it("gives a top-level post its bare name under the route strategy", () => {
    assertIdentical(slugFromPath("about.md", "route"), "about");
  });

  it("uses forward slashes whatever the platform separator is", () => {
    const slug = slugFromPath(path.join("a", "b", "c.md"), "route");

    assertStringNotIncludes(slug, "\\");
    assertIdentical(slug, "a/b/c");
  });
});
