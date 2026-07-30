import { astroComponent } from "./astro.js";
import { hugoPartial } from "./hugo.js";

/** A template a site can have written into it, and where it goes. */
export interface Adapter {
  /** Path the file is written to, relative to the site root. */
  readonly file: string;
  readonly contents: string;
  /** What to do with it once it is there. */
  readonly usage: string;
}

/**
 * The adapters `colophon eject` knows about.
 *
 * One so far. It is a record rather than a special case for Hugo because the
 * command has to name the ones it does know when asked for one it does not,
 * and because the next generator is a second entry rather than a second
 * command.
 */
export const adapters: Readonly<Record<string, Adapter>> = {
  astro: {
    file: "src/components/ColophonMeta.astro",
    contents: astroComponent,
    usage:
      `Use it in your layout's head:\n` +
      `  <ColophonMeta />\n` +
      `and point the config's manifest option at src/data/colophon.json.`,
  },
  hugo: {
    file: "layouts/partials/colophon.html",
    contents: hugoPartial,
    usage:
      `Call it from your head:\n` +
      `  {{ partial "colophon.html" . }}\n` +
      `and point the config's manifest option at data/colophon.json.`,
  },
};

/** The adapter names, for the help text and for a run that misspells one. */
export const adapterNames: readonly string[] = Object.keys(adapters);
