import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  assertArrayEquals,
  assertFileExists,
  assertFileIncludes,
  assertIdentical,
  assertStringIncludes,
  assertThrowsErrorAsync,
  assertUndefined,
} from "@kensio/smartass";
import { afterEach, beforeEach, describe, it, vi } from "vitest";

import { metaTags } from "../meta/index.js";
import type { CliArgs } from "./args/index.js";
import { parseCliArgs } from "./args/index.js";
import { hugoPartial } from "./eject/hugo.js";
import { runEject } from "./eject/index.js";

/** The command line `colophon eject` runs with, plus whatever a case needs. */
function args(overrides: Partial<CliArgs> = {}): CliArgs {
  return {
    command: "eject",
    contentDir: undefined,
    file: undefined,
    adapter: "hugo",
    configPath: undefined,
    overwrite: false,
    dryRun: false,
    watch: false,
    concurrency: undefined,
    size: undefined,
    ...overrides,
  };
}

const partial = path.join("layouts", "partials", "colophon.html");

const byName = (a: string, b: string): number => a.localeCompare(b);

describe("eject arguments", () => {
  it("reads the generator from the positional", () => {
    const parsed = parseCliArgs(["eject", "hugo"]);

    assertIdentical(parsed.command, "eject");
    assertIdentical(parsed.adapter, "hugo");
    // It is a generator's name, not a path, so it must not be read as one.
    assertUndefined(parsed.contentDir);
  });
});

describe("the Hugo partial", () => {
  it("emits the tags metaTags does", () => {
    // Two implementations of one job: `metaTags` for a site that renders in
    // JavaScript, this for one that renders in Go. Verified against Hugo 0.162
    // as producing byte-identical tags for the same manifest, which is a check
    // that needs Hugo installed. What can be checked here is that neither side
    // grows a tag without the other, which is how they would drift.
    const inPartial = new Set(
      Array.from(
        hugoPartial.matchAll(/(?:property|name)="([^"{]+)"/g),
        ([, tag]) => tag ?? "",
      ),
    );
    const inMetaTags = metaTags(
      {
        version: 1,
        pages: {
          post: {
            images: { og: { url: "/og.png", width: 1200, height: 630 } },
            widest: "og",
            alt: "A post",
          },
        },
      },
      "post",
    ).map((tag) => ("property" in tag ? tag.property : tag.name));

    assertArrayEquals(
      [...inPartial].toSorted(byName),
      inMetaTags.toSorted(byName),
    );
  });
});

describe("runEject", () => {
  let dir: string;
  let logged: string[];

  beforeEach(async () => {
    logged = [];
    vi.spyOn(console, "log").mockImplementation((...parts: unknown[]) => {
      logged.push(parts.join(" "));
    });
    dir = await mkdtemp(path.join(tmpdir(), "colophon-eject-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("writes the Hugo partial where Hugo looks for one", async () => {
    await runEject(args(), dir);

    const target = path.join(dir, partial);
    assertFileExists(target);
    await assertFileIncludes(target, "og:image");
    // The lookup the partial exists for: a build's manifest, read as site data.
    await assertFileIncludes(target, "hugo.Data.colophon");
  });

  it("says how to use what it wrote", async () => {
    await runEject(args(), dir);

    const output = logged.join("\n");
    assertStringIncludes(output, partial);
    assertStringIncludes(output, 'partial "colophon.html"');
    assertStringIncludes(output, "data/colophon.json");
  });

  it("refuses to overwrite a partial that is already there", async () => {
    await mkdir(path.join(dir, "layouts", "partials"), { recursive: true });
    await writeFile(path.join(dir, partial), "mine", "utf8");

    const error = await assertThrowsErrorAsync(async () =>
      runEject(args(), dir),
    );

    // It is a file the site was invited to edit, so replacing it has to be asked
    // for rather than assumed.
    assertStringIncludes(error.message, "already there");
    assertIdentical(await readFile(path.join(dir, partial), "utf8"), "mine");
  });

  it("replaces one under --force", async () => {
    await mkdir(path.join(dir, "layouts", "partials"), { recursive: true });
    await writeFile(path.join(dir, partial), "mine", "utf8");

    await runEject(args({ overwrite: true }), dir);

    await assertFileIncludes(path.join(dir, partial), "og:image");
  });

  it("names the generators it knows when asked for none", async () => {
    const error = await assertThrowsErrorAsync(async () =>
      runEject(args({ adapter: undefined }), dir),
    );

    assertStringIncludes(error.message, "hugo");
  });

  it("suggests the generator a misspelling was aiming at", async () => {
    const error = await assertThrowsErrorAsync(async () =>
      runEject(args({ adapter: "hugu" }), dir),
    );

    assertStringIncludes(error.message, 'Did you mean "hugo"?');
  });

  it("lists the generators when a name is nothing like one", async () => {
    const error = await assertThrowsErrorAsync(async () =>
      runEject(args({ adapter: "wordpress" }), dir),
    );

    assertStringIncludes(error.message, "Try one of: hugo.");
  });
});
