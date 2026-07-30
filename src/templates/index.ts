import type { Template } from "../types.js";
import { articleTemplate } from "./article/index.js";
import { bannerTemplate } from "./banner/index.js";
import { cardTemplate } from "./card/index.js";
import { codeTemplate } from "./code/index.js";
import { docsTemplate } from "./docs/index.js";
import { eventTemplate } from "./event/index.js";
import { photoTemplate } from "./photo/index.js";
import { quoteTemplate } from "./quote/index.js";
import { releaseTemplate } from "./release/index.js";
import { statTemplate } from "./stat/index.js";
import { terminalTemplate } from "./terminal/index.js";
import { wordmarkTemplate } from "./wordmark/index.js";

/**
 * Templates registered out of the box. Projects can add to or override these
 * via `config.templates`.
 */
export const builtinTemplates: Readonly<Record<string, Template>> = {
  [articleTemplate.name]: articleTemplate,
  [bannerTemplate.name]: bannerTemplate,
  [cardTemplate.name]: cardTemplate,
  [codeTemplate.name]: codeTemplate,
  [docsTemplate.name]: docsTemplate,
  [eventTemplate.name]: eventTemplate,
  [photoTemplate.name]: photoTemplate,
  [quoteTemplate.name]: quoteTemplate,
  [releaseTemplate.name]: releaseTemplate,
  [statTemplate.name]: statTemplate,
  [terminalTemplate.name]: terminalTemplate,
  [wordmarkTemplate.name]: wordmarkTemplate,
};

export { articleTemplate } from "./article/index.js";
export { bannerTemplate } from "./banner/index.js";
export { cardTemplate } from "./card/index.js";
export { codeTemplate } from "./code/index.js";
export { docsTemplate } from "./docs/index.js";
export { eventTemplate } from "./event/index.js";
export { photoTemplate } from "./photo/index.js";
export { quoteTemplate } from "./quote/index.js";
export { releaseTemplate } from "./release/index.js";
export { statTemplate } from "./stat/index.js";
export { terminalTemplate } from "./terminal/index.js";
export { wordmarkTemplate } from "./wordmark/index.js";
export { optionalString } from "../props.js";
