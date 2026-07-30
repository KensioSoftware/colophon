import { expandTabs, highlightCode } from "../../highlight/index.js";
import type { CodeToken, HighlightedCode } from "../../highlight/index.js";
import { optionalString } from "../../props.js";
import type { MetaImageProps, ResolvedConfig } from "../../types.js";

/** How faint the output is against the command that produced it. */
const outputOpacity = 0.68;

/** What goes in front of a command when the post names no prompt. */
const defaultPrompt = "$";

/** One line of output: no grammar, no colour of its own, just dimmer. */
function outputLine(text: string, tabSize: number): CodeToken[] {
  return [
    {
      text: expandTabs(text, tabSize),
      column: 0,
      color: undefined,
      opacity: outputOpacity,
      bold: false,
      italic: false,
    },
  ];
}

/** The prompt itself, in the site's accent colour. */
function promptToken(prompt: string, accent: string): CodeToken {
  return {
    text: prompt,
    column: 0,
    color: accent,
    opacity: undefined,
    bold: true,
    italic: false,
  };
}

/** The width of the widest line, in characters. */
function widest(lines: readonly (readonly CodeToken[])[]): number {
  let longest = 0;

  for (const tokens of lines) {
    const last = tokens.at(-1);

    if (last !== undefined) {
      longest = Math.max(longest, last.column + last.text.length);
    }
  }

  return longest;
}

/**
 * The session as one grid of lines: the commands, then what they printed.
 *
 * The commands go through the syntax highlighter as shell, which is what makes
 * a flag look like a flag and a string look like a string. The output does
 * not: it is whatever the program printed, and a shell grammar run over it
 * would colour arbitrary words for reasons the reader cannot see. It is set in
 * the theme's own foreground, a little faded, which is the difference a
 * terminal shows between what you typed and what came back.
 *
 * Both are on one grid so that the whole session is fitted, clipped and drawn
 * by the same code the `code` template uses.
 */
export async function terminalSession(
  props: MetaImageProps,
  config: ResolvedConfig,
): Promise<HighlightedCode> {
  const prompt = optionalString(props["prompt"]) ?? defaultPrompt;
  const command = optionalString(props["command"]) ?? "";
  const output = optionalString(props["output"]) ?? "";
  const { tabSize } = config.code;

  const highlighted = await highlightCode(command, {
    language: "bash",
    theme: optionalString(props["theme"]) ?? config.code.theme,
    tabSize,
  });

  const indent = prompt === "" ? 0 : prompt.length + 1;
  const commands = highlighted.lines.map((tokens) => [
    ...(indent === 0 ? [] : [promptToken(prompt, config.colors.brandWarm)]),
    ...tokens.map((token) => ({ ...token, column: token.column + indent })),
  ]);

  const printed =
    output === ""
      ? []
      : output
          .replaceAll("\r\n", "\n")
          .replace(/\n+$/, "")
          .split("\n")
          .map((line) => outputLine(line, tabSize));

  const lines = [...(command === "" ? [] : commands), ...printed];

  return { ...highlighted, lines, longestLine: widest(lines) };
}
