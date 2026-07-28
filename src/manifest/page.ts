import type { RenderJob } from "../generate/job.js";
import type { ManifestImage, ManifestPage } from "../types.js";

/**
 * One page as it is collected: the jobs that draw it, and the most landscape
 * of them so far.
 *
 * A page is created from its first job rather than from an empty list, so
 * there is never a page without images to explain away — `widest` has to name
 * one of them.
 */
export interface PageDraft {
  readonly jobs: RenderJob[];
  widest: RenderJob;
}

/** How landscape an image is. The most landscape one is what `widest` names. */
function ratio(job: RenderJob): number {
  return job.size.width / job.size.height;
}

/** Start a page off from the first job that draws it. */
export function startPage(job: RenderJob): PageDraft {
  return { jobs: [job], widest: job };
}

/**
 * Add another size of the same page. Ties keep the size configured first,
 * since `>` leaves the incumbent in place.
 */
export function addToPage(page: PageDraft, job: RenderJob): void {
  page.jobs.push(job);

  if (ratio(job) > ratio(page.widest)) {
    page.widest = job;
  }
}

/**
 * Reject two pages sharing a slug.
 *
 * The manifest is keyed by slug, so a site looking a page up would find
 * whichever was written last — an image quietly belonging to the wrong post,
 * which is worse than no manifest at all. Their images may well be distinct on
 * disk, so nothing else in the build has any reason to complain.
 */
function assertOnePage(slug: string, page: PageDraft): void {
  const paths = [...new Set(page.jobs.map((job) => job.contentPath))];

  if (paths.length > 1) {
    throw new Error(
      `Two pages share the slug "${slug}": ${paths.join(" and ")}. The` +
        ` manifest is keyed by slug, so they cannot both be found. Give one a` +
        ` slug of its own, or use slugStrategy: "route".`,
    );
  }
}

function toImage(job: RenderJob): ManifestImage {
  return {
    ...(job.url !== undefined && { url: job.url }),
    width: job.size.width,
    height: job.size.height,
  };
}

/** Finish a page: its images by size name, sorted, plus what they add up to. */
export function toPage(slug: string, page: PageDraft): ManifestPage {
  assertOnePage(slug, page);

  const title = page.widest.props.title;

  return {
    images: Object.fromEntries(
      page.jobs
        .map((job): [string, ManifestImage] => [job.size.name, toImage(job)])
        .toSorted(([a], [b]) => a.localeCompare(b)),
    ),
    widest: page.widest.size.name,
    ...(typeof title === "string" && title !== "" && { alt: title }),
  };
}
