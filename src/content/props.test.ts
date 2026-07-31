import {
  assertIdentical,
  assertNonNullable,
  assertObjectEquals,
  assertUndefined,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { extractProps } from "./props.js";

describe("extractProps", () => {
  it("returns undefined when the props key is absent", () => {
    assertUndefined(extractProps({ title: "t" }));
  });

  it("returns undefined when the props value is not an object", () => {
    assertUndefined(extractProps({ meta_img_props: "nope" }));
    assertUndefined(extractProps({ meta_img_props: ["a"] }));
  });

  it("returns undefined when there is no template and no default", () => {
    assertUndefined(extractProps({ meta_img_props: { title: "t" } }));
  });

  it("uses the default template when the field is missing", () => {
    const props = extractProps(
      { meta_img_props: { title: "t" } },
      { defaultTemplate: "banner" },
    );

    assertNonNullable(props);
    assertIdentical(props.template, "banner");
  });

  it("omits the title when absent, and coerces a scalar one", () => {
    const untitled = extractProps({ meta_img_props: { template: "code" } });
    assertNonNullable(untitled);
    assertUndefined(untitled.title);

    const numeric = extractProps({
      meta_img_props: { template: "banner", title: 5 },
    });
    assertNonNullable(numeric);
    assertIdentical(numeric.title, "5");
  });

  it("falls back to the post's own title", () => {
    const props = extractProps({
      title: "Setting up continuous integration",
      meta_img_props: { template: "banner" },
    });

    assertNonNullable(props);
    assertIdentical(props.title, "Setting up continuous integration");
  });

  it("prefers a title the props block gives to the post's own", () => {
    const props = extractProps({
      title: "Setting up continuous integration",
      meta_img_props: { template: "banner", title: "CI" },
    });

    assertNonNullable(props);
    assertIdentical(props.title, "CI");
  });

  it("prefers a title the mapper gives to the post's own", () => {
    const props = extractProps(
      { title: "Setting up continuous integration", headline: "CI" },
      {
        defaultTemplate: "banner",
        props: (frontmatter) => ({ title: frontmatter["headline"] }),
      },
    );

    assertNonNullable(props);
    assertIdentical(props.title, "CI");
  });

  it("does not let a post's title ask for an image on its own", () => {
    // The fallback fills a title in for a post already having an image. A
    // file that asked for none is still a file that asked for none, or every
    // markdown file with a title would start rendering one.
    assertUndefined(extractProps({ title: "Not a post worth sharing" }));
    assertUndefined(
      extractProps({ title: "Nor this" }, { defaultTemplate: "banner" }),
    );
  });

  it("reads template, title, subtitle, version and extras", () => {
    const props = extractProps({
      meta_img_props: {
        template: "banner",
        title: "Hello",
        subtitle: "Sub",
        version: 3,
        accent: "#f00",
      },
    });

    assertObjectEquals(props, {
      template: "banner",
      title: "Hello",
      subtitle: "Sub",
      version: "3",
      accent: "#f00",
    });
  });

  it("honours a custom props key and template field", () => {
    const props = extractProps(
      { og: { format: "card", title: "T", extra: 1 } },
      { propsKey: "og", templateField: "format" },
    );

    assertObjectEquals(props, { template: "card", title: "T", extra: 1 });
  });
});
