import {
  assertArrayIncludes,
  assertArrayLength,
  assertStringIncludes,
  assertStringNotIncludes,
  assertTrue,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { renderTemplate as render, wide } from "../test/template.js";
import { terminalTemplate } from "./templates/index.js";

/** Every colour a token is drawn in, which the theme and the prompt decide. */
function tokenFills(svg: string): readonly string[] {
  return Array.from(svg.matchAll(/<tspan [^>]*fill="([^"]+)"/g), (match) =>
    String(match[1]),
  );
}

describe("terminalTemplate", () => {
  it("draws the window, the prompt, the command and its output", async () => {
    const svg = await render(terminalTemplate, {
      template: "terminal",
      title: "colophon",
      command: "colophon build content",
      output: "rendered 14 images\ndone in 1.9s",
    });

    assertStringIncludes(svg, ">$</tspan>");
    assertStringIncludes(svg, ">colophon</tspan>");
    assertStringIncludes(svg, ">rendered 14 images</tspan>");
    assertStringIncludes(svg, ">done in 1.9s</tspan>");
    // The window's title, which is set in the sans family rather than on the
    // character grid the session is drawn on.
    assertStringIncludes(svg, ">colophon</text>");
    // A line of the session apiece, and each one drawn as a whole.
    assertArrayLength(svg.match(/<text y=/g), 3);
  }, 5000);

  it("draws the three buttons and the bar they sit on", async () => {
    const svg = await render(terminalTemplate, {
      template: "terminal",
      command: "ls",
    });

    assertStringIncludes(svg, 'fill="#ff5f57"');
    assertStringIncludes(svg, 'fill="#febc2e"');
    assertStringIncludes(svg, 'fill="#28c840"');
  }, 5000);

  it("takes the prompt from the post", async () => {
    const svg = await render(terminalTemplate, {
      template: "terminal",
      prompt: "❯",
      command: "ls",
    });

    assertStringIncludes(svg, ">❯</tspan>");
    assertStringNotIncludes(svg, ">$</tspan>");
  }, 5000);

  it("colours the prompt with the site's accent", async () => {
    const svg = await render(
      terminalTemplate,
      { template: "terminal", command: "ls" },
      { colors: { brand: "#0f172a", brandWarm: "#38bdf8" } },
    );

    assertArrayIncludes(tokenFills(svg), "#38bdf8");
  }, 5000);

  it("highlights the command as shell and leaves the output plain", async () => {
    const svg = await render(terminalTemplate, {
      template: "terminal",
      command: "grep --colour 'x' file",
      output: "grep --colour 'x' file",
    });

    // The same words, coloured where they were typed and not where they were
    // printed: the output line is one run in the theme's own foreground.
    assertStringIncludes(svg, 'fill-opacity="0.68"');
    assertTrue(new Set(tokenFills(svg)).size > 2);
  }, 5000);

  it("takes the window's colours from the code theme", async () => {
    const dark = await render(terminalTemplate, {
      template: "terminal",
      command: "ls",
    });
    const light = await render(
      terminalTemplate,
      { template: "terminal", command: "ls" },
      { code: { theme: "github-light" } },
    );

    assertStringIncludes(dark, 'fill="#24292e"');
    assertStringNotIncludes(light, 'fill="#24292e"');
  }, 5000);

  it("truncates a session too long to fit, and says so", async () => {
    const warnings: string[] = [];
    const svg = await render(
      terminalTemplate,
      {
        template: "terminal",
        command: "make",
        output: Array.from(
          { length: 200 },
          (_unused, line) => `building target ${String(line)}`,
        ).join("\n"),
      },
      {
        onWarning: (message) => {
          warnings.push(message);
        },
      },
      wide,
    );

    assertStringIncludes(svg, ">…</tspan>");
    assertArrayLength(warnings, 1);
    assertStringIncludes(warnings[0], "terminal session does not fit");
  }, 5000);

  it("prompts each command in a block, but not the blank line between", async () => {
    const svg = await render(terminalTemplate, {
      template: "terminal",
      command: "npm install\n\nnpm test",
    });

    // One prompt for each of the two commands, and the blank line drawn as
    // nothing rather than as a prompt with no command after it.
    assertArrayLength(svg.match(/>\$<\/tspan>/g), 2);
    assertArrayLength(svg.match(/<text y=/g), 2);
  }, 5000);

  it("renders output on its own, with no prompt above it", async () => {
    const svg = await render(terminalTemplate, {
      template: "terminal",
      output: "nothing was typed",
    });

    assertStringIncludes(svg, ">nothing was typed</tspan>");
    assertStringNotIncludes(svg, ">$</tspan>");
  }, 5000);
});
