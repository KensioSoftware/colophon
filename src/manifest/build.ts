import type { RenderJob } from "../generate/job.js";
import type { Manifest } from "../types.js";
import { byName } from "./order.js";
import type { PageDraft } from "./page.js";
import { addToPage, startPage, toPage } from "./page.js";

/**
 * Collect the jobs of each page, keyed by the slug a site addresses it by.
 *
 * Extras are dropped: the manifest is a map of pages, and an extra image has
 * no page behind it. A project that named the path of one already knows where
 * it is, which is the question this file answers for everything else.
 */
function drafts(jobs: readonly RenderJob[]): Map<string, PageDraft> {
  const pages = new Map<string, PageDraft>();

  for (const job of jobs) {
    if (job.slug === undefined) {
      continue;
    }

    const page = pages.get(job.slug);

    if (page === undefined) {
      pages.set(job.slug, startPage(job));
    } else {
      addToPage(page, job);
    }
  }

  return pages;
}

/**
 * Build the manifest for a planned build.
 *
 * It is built from the jobs rather than from what was written, so a rebuild
 * that skips every image still describes the whole site. The manifest says
 * what exists, not what happened this time.
 *
 * Pages are sorted by slug, and each page's images by size name, so a manifest
 * committed to a repository changes only when the build does.
 */
export function buildManifest(jobs: readonly RenderJob[]): Manifest {
  const pages = [...drafts(jobs)].toSorted(([a], [b]) => byName(a, b));

  return {
    version: 1,
    pages: Object.fromEntries(
      pages.map(([slug, page]) => [slug, toPage(slug, page)]),
    ),
  };
}
