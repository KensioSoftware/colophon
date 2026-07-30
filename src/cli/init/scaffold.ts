/**
 * The config module `colophon init` writes.
 *
 * Most of it is commented out on purpose. What is left renders something
 * recognisable straight away, and the comments say where the next decision goes
 * rather than making every decision for the project up front. It is valid
 * TypeScript as well as JavaScript, so it can be written to either extension.
 */
export const scaffold = `// Colophon config. Every field is optional.
// Full documentation: https://colophonjs.dev/
import { defineConfig } from "@kensio/colophon";

export default defineConfig({
  // Brand colours. The default background is a gradient built from these.
  colors: {
    brand: "#4f46e5",
    brandDark: "#3730a3",
    brandWarm: "#db2777",
  },

  // Or start from a named look, which brings its own colours, background and
  // texture: aurora, bloom, ember, forest, midnight, paper, sandstone, slate.
  // theme: "midnight",

  // Drawn along the bottom of every image.
  footer: "example.com",

  // A small label above the title, on the banner template.
  // badge: { text: "npm" },

  // The sizes rendered for each post. This is the default pair.
  // sizes: [
  //   { name: "og", width: 1200, height: 630 },
  //   { name: "square", width: 1200, height: 1200 },
  // ],

  // Handing the renderer font files, rather than hoping the machine has the
  // family installed, is what makes a build render the same image everywhere.
  // fonts: [{ family: "Inter", path: "fonts/Inter-Bold.ttf" }],

  // Build image props from the frontmatter your posts already carry, so there
  // is no props block to add to every file.
  // content: {
  //   defaultTemplate: "banner",
  //   props: (frontmatter) => ({
  //     title: frontmatter.title,
  //     subtitle: frontmatter.description,
  //   }),
  // },
});
`;
