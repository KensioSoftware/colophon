import type { Template } from "../types.js";
import { bannerTemplate } from "./banner.js";
import { cardTemplate } from "./card.js";
import { codeTemplate } from "./code.js";

/**
 * Templates registered out of the box. Projects can add to or override these
 * via `config.templates`.
 */
export const builtinTemplates: Readonly<Record<string, Template>> = {
  [bannerTemplate.name]: bannerTemplate,
  [cardTemplate.name]: cardTemplate,
  [codeTemplate.name]: codeTemplate,
};

export { bannerTemplate } from "./banner.js";
export { cardTemplate } from "./card.js";
export { codeTemplate } from "./code.js";
export { optionalString } from "./props.js";
