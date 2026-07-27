import {
  assertIdentical,
  assertNonNullable,
  assertUndefined,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { extractProps } from "./props.js";

/** A site whose posts carry `title`/`description`, as most already do. */
const fromFrontmatter = {
  defaultTemplate: "banner",
  props: (frontmatter: Record<string, unknown>) => ({
    title: frontmatter["title"],
    subtitle: frontmatter["description"],
  }),
};

/** The same site, once it starts leaving unpublished posts out of the build. */
const skippingDrafts = {
  defaultTemplate: "banner",
  props: (frontmatter: Record<string, unknown>) =>
    frontmatter["draft"] === true ? undefined : { title: frontmatter["title"] },
};

describe("extractProps with a frontmatter mapper", () => {
  it("builds props from a post that declares none", () => {
    const props = extractProps(
      { title: "Existing post", description: "Written years ago" },
      fromFrontmatter,
    );

    assertNonNullable(props);
    assertIdentical(props.template, "banner");
    assertIdentical(props.title, "Existing post");
    assertIdentical(props.subtitle, "Written years ago");
  });

  it("lets a post override one mapped field and keep the rest", () => {
    const props = extractProps(
      {
        title: "Existing post",
        description: "Written years ago",
        meta_img_props: { subtitle: "A better subtitle" },
      },
      fromFrontmatter,
    );

    assertNonNullable(props);
    assertIdentical(props.subtitle, "A better subtitle");
    // Restating the whole block to correct one field would defeat the point.
    assertIdentical(props.title, "Existing post");
  });

  it("lets a post override the template the mapper chose", () => {
    const props = extractProps(
      { title: "Snippet", meta_img_props: { template: "code" } },
      fromFrontmatter,
    );

    assertNonNullable(props);
    assertIdentical(props.template, "code");
  });

  it("skips a post the mapper opts out of", () => {
    assertUndefined(
      extractProps({ title: "Draft", draft: true }, skippingDrafts),
    );
  });

  it("still renders a post that asks outright, even when the mapper skips it", () => {
    const props = extractProps(
      { title: "Draft", draft: true, meta_img_props: { template: "card" } },
      skippingDrafts,
    );

    assertNonNullable(props);
    assertIdentical(props.template, "card");
  });

  it("skips a mapped post with no template to render with", () => {
    assertUndefined(
      extractProps(
        { title: "Existing post" },
        { props: (frontmatter) => ({ title: frontmatter["title"] }) },
      ),
    );
  });
});
