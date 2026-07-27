import type { Template } from "../types.js";
import { bannerTemplate } from "./banner/index.js";
import { cardTemplate } from "./card/index.js";
import { codeTemplate } from "./code/index.js";

/**
 * Templates registered out of the box. Projects can add to or override these
 * via `config.templates`.
 */
export const builtinTemplates: Readonly<Record<string, Template>> = {
  [bannerTemplate.name]: bannerTemplate,
  [cardTemplate.name]: cardTemplate,
  [codeTemplate.name]: codeTemplate,
};

export { bannerTemplate } from "./banner/index.js";
export { cardTemplate } from "./card/index.js";
export { codeTemplate } from "./code/index.js";
export { optionalString } from "./props.js";
