import { readFile } from "node:fs/promises";

import matter from "gray-matter";

import type {
  ContentFile,
  ColophonConfig,
  MetaImageProps,
} from "../../types.js";

const defaultPropsKey = "meta_img_props";
const defaultTemplateField = "template";

export interface PlaygroundFrontmatter {
  readonly text: string;
  readonly omitted: readonly string[];
}

function browserProps(props: MetaImageProps): {
  readonly props: MetaImageProps;
  readonly omitted: readonly string[];
} {
  const kept: Record<string, unknown> = { ...props };
  const omitted: string[] = [];
  for (const name of ["avatar", "image"] as const) {
    const value = kept[name];
    if (typeof value === "string" && !value.startsWith("data:")) {
      delete kept[name];
      omitted.push(`frontmatter.${name}`);
    }
  }
  return { props: kept as MetaImageProps, omitted };
}

/** Put the effective props under the frontmatter names this config reads. */
function declaredProps(
  props: MetaImageProps,
  config: ColophonConfig | undefined,
): Record<string, unknown> {
  const templateField = config?.content?.templateField ?? defaultTemplateField;
  const { template, ...rest } = props;
  return { [templateField]: template, ...rest };
}

/** A generic post for a project where no content file could be found. */
export function fallbackFrontmatter(
  config: ColophonConfig | undefined,
): string {
  const propsKey = config?.content?.propsKey ?? defaultPropsKey;
  const templateField = config?.content?.templateField ?? defaultTemplateField;
  const template = config?.content?.defaultTemplate ?? "banner";

  return matter.stringify("", {
    title: "Sample post",
    [propsKey]: { [templateField]: template },
  });
}

/** Read a post and make its mapper-produced props explicit for the playground. */
export async function sampleFrontmatter(
  file: ContentFile,
  config: ColophonConfig | undefined,
): Promise<PlaygroundFrontmatter> {
  const parsed = matter(await readFile(file.absolutePath, "utf8"));
  const propsKey = config?.content?.propsKey ?? defaultPropsKey;
  const browser = browserProps(file.props);

  return {
    text: matter.stringify("", {
      ...parsed.data,
      [propsKey]: declaredProps(browser.props, config),
    }),
    omitted: browser.omitted,
  };
}
