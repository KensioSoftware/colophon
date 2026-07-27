import type { ResolvedConfig, Template } from "../types.js";

/**
 * Look up the template a set of props asks for, failing with the names that
 * are actually available. A template name comes from frontmatter, so getting
 * it wrong is routine, and "unknown template" alone leaves the author guessing
 * at what the project registered.
 */
export function selectTemplate(config: ResolvedConfig, name: string): Template {
  const template = config.templates[name];

  if (template === undefined) {
    const available = Object.keys(config.templates)
      .toSorted((a, b) => a.localeCompare(b))
      .join(", ");
    throw new Error(
      `Unknown template "${name}". Available templates: ${available}.`,
    );
  }

  return template;
}
