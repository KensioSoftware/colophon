import type { ColophonConfig, ContentOptions } from "../../types.js";
import { browserBackground, browserSize } from "./background.js";

export interface PlaygroundConfig {
  readonly text: string;
  readonly omitted: readonly string[];
}

function browserContent(
  content: ContentOptions | undefined,
  omitted: string[],
): ContentOptions | undefined {
  if (content === undefined) {
    return undefined;
  }

  const { props, ...rest } = content;
  if (props !== undefined) {
    omitted.push("content.props");
  }
  return rest;
}

/** Write the JSON subset of a project config that the browser can use. */
export function configForPlayground(
  config: ColophonConfig | undefined,
): PlaygroundConfig {
  if (config === undefined) {
    return { text: "{}", omitted: [] };
  }

  const omitted: string[] = [];
  const {
    background,
    content,
    extra,
    fonts,
    logo,
    manifest,
    onWarning,
    placement,
    rasteriser,
    sizes,
    templates,
    ...rest
  } = config;

  const named = [
    ["extra", extra],
    ["fonts", fonts],
    ["logo", logo],
    ["manifest", manifest],
    ["onWarning", onWarning],
    ["placement", placement],
    ["rasteriser", rasteriser],
    ["templates", templates],
  ] as const;
  for (const [name, value] of named) {
    if (value !== undefined) {
      omitted.push(name);
    }
  }

  const keptBackground = browserBackground(background, "background", omitted);
  const keptContent = browserContent(content, omitted);
  const browserConfig: ColophonConfig = {
    ...rest,
    ...(keptBackground === undefined ? {} : { background: keptBackground }),
    ...(keptContent === undefined ? {} : { content: keptContent }),
    ...(sizes === undefined
      ? {}
      : { sizes: sizes.map((size) => browserSize(size, omitted)) }),
  };

  return { text: JSON.stringify(browserConfig, undefined, 2), omitted };
}
