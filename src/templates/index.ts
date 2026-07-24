import type { Template } from "../types.js";
import { bannerTemplate } from "./banner.js";
import { cardTemplate } from "./card.js";

/**
 * Templates registered out of the box. Projects can add to or override these
 * via `config.templates`.
 */
export const builtinTemplates: Readonly<Record<string, Template>> = {
  [bannerTemplate.name]: bannerTemplate,
  [cardTemplate.name]: cardTemplate,
};

export { bannerTemplate } from "./banner.js";
export { cardTemplate } from "./card.js";
