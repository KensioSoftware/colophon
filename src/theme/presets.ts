import type { Background, BrandColors, Texture, ThemeName } from "../types.js";

/**
 * What a named theme sets. Every field is an ordinary config option, because
 * that is all a theme is: a set of defaults for fields a project could have
 * written out itself, and would rather not.
 */
export interface Theme {
  readonly colors: Required<BrandColors>;
  readonly background: Background;
  readonly texture?: Texture;
}

/**
 * The curated set.
 *
 * Each one is a whole look rather than a palette, which is why the background
 * is written out here instead of being derived from the colours: `midnight`
 * without its mesh and `slate` without its dot grid are the same flat image in
 * two shades of navy. Deriving would also mean a theme could only ever be the
 * one gradient the defaults already give.
 *
 * Six of them are dark, since white text on a deep background is what a share
 * image is usually asked to be, and two are light, because a site whose own
 * pages are light has nothing to reach for otherwise.
 *
 * All of them carry a texture, since a treatment is most of what separates a
 * theme from a palette, and every one of them is drawn from the cheap end of
 * the set. What that costs is worth writing down, measured on a 1200x1200
 * card: `aurora` goes from 244KB to 279KB, `bloom` from 342KB to 372KB, and
 * `ember` from 99KB to 192KB, which is the largest jump here and still the
 * smallest image of the three.
 *
 * None of them turns `waves` or `moire` on, which are the two that do not
 * compress: either takes a 1200x1200 PNG from around 36KB to several hundred,
 * because a turned or crossed set of lines meets itself somewhere different in
 * every row and there is nothing for the compression to fold up. That is a
 * cost worth paying on purpose, and not one to hand someone who picked a theme
 * by its name and is committing the images next to their posts.
 */
export const THEMES: Readonly<Record<ThemeName, Theme>> = {
  midnight: {
    colors: {
      brand: "#6366f1",
      brandDark: "#0b1020",
      brandWarm: "#a855f7",
      foreground: "#e6e9f5",
    },
    background: {
      type: "mesh",
      color: "#0b1020",
      blobs: [
        { color: "#4338ca", x: 0.12, y: 0.05, radius: 0.55, opacity: 0.85 },
        { color: "#7c3aed", x: 0.9, y: 0.85, radius: 0.5, opacity: 0.7 },
        { color: "#1d4ed8", x: 0.6, y: 1, radius: 0.4, opacity: 0.45 },
      ],
    },
    texture: { type: "dots", opacity: 0.05 },
  },

  aurora: {
    colors: {
      brand: "#14b8a6",
      brandDark: "#04211f",
      brandWarm: "#8b5cf6",
      foreground: "#ecfdf5",
    },
    background: {
      type: "mesh",
      color: "#04211f",
      blobs: [
        { color: "#14b8a6", x: 0.15, y: 0.85, radius: 0.7, opacity: 0.85 },
        { color: "#22d3ee", x: 0.75, y: 0.15, radius: 0.6, opacity: 0.7 },
        { color: "#8b5cf6", x: 1, y: 0.9, radius: 0.5, opacity: 0.55 },
      ],
    },
    texture: { type: "crosses", opacity: 0.07 },
  },

  ember: {
    colors: {
      brand: "#f97316",
      brandDark: "#1a0b06",
      brandWarm: "#ef4444",
      foreground: "#fff7ed",
    },
    background: {
      type: "gradient",
      stops: [
        { offset: "0%", color: "#1a0b06" },
        { offset: "55%", color: "#7c2d12" },
        { offset: "100%", color: "#ea580c" },
      ],
    },
    texture: { type: "rays", opacity: 0.06 },
  },

  forest: {
    colors: {
      brand: "#22c55e",
      brandDark: "#04140c",
      brandWarm: "#a3e635",
      foreground: "#ecfdf5",
    },
    background: {
      type: "gradient",
      stops: [
        { offset: "0%", color: "#04140c" },
        { offset: "55%", color: "#14532d" },
        { offset: "100%", color: "#166534" },
      ],
    },
    texture: { type: "rules", opacity: 0.05 },
  },

  bloom: {
    colors: {
      brand: "#ec4899",
      brandDark: "#2e1065",
      brandWarm: "#f59e0b",
      foreground: "#fdf4ff",
    },
    background: {
      type: "mesh",
      color: "#2e1065",
      blobs: [
        { color: "#db2777", x: 0.2, y: 0.2, radius: 0.8, opacity: 0.85 },
        { color: "#f472b6", x: 0.9, y: 0.35, radius: 0.5, opacity: 0.5 },
        { color: "#7c3aed", x: 0.5, y: 1, radius: 0.75, opacity: 0.8 },
      ],
    },
    texture: { type: "dots", opacity: 0.06 },
  },

  slate: {
    colors: {
      brand: "#38bdf8",
      brandDark: "#0f172a",
      brandWarm: "#64748b",
      foreground: "#f1f5f9",
    },
    background: { type: "solid", color: "#0f172a" },
    texture: { type: "dots", opacity: 0.07 },
  },

  paper: {
    colors: {
      brand: "#b45309",
      brandDark: "#78350f",
      brandWarm: "#d97706",
      foreground: "#1c1917",
    },
    background: { type: "solid", color: "#faf7f0" },
    texture: { type: "rules", opacity: 0.05 },
  },

  sandstone: {
    colors: {
      brand: "#c2410c",
      brandDark: "#9a3412",
      brandWarm: "#f59e0b",
      foreground: "#292524",
    },
    background: {
      type: "gradient",
      stops: [
        { offset: "0%", color: "#fdf6ec" },
        { offset: "55%", color: "#f7e6cf" },
        { offset: "100%", color: "#f2d5b3" },
      ],
    },
    texture: { type: "dots", opacity: 0.06 },
  },
};

/**
 * The theme names, for validation and for anything listing them. Asserted
 * rather than written out again, because `Object.keys` loses the key type and
 * a second copy of the list is one that can drift from the set above.
 */
export const themeNames = Object.keys(THEMES) as readonly ThemeName[];
