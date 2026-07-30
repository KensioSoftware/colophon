/** Help text for `--help`, and for a run that asks for nothing else. */
export const usage = `colophon: generate social meta images from frontmatter

Usage:
  colophon [contentDir] [options]    Render the images for a content tree
  colophon init [contentDir]         Write a starter config module
  colophon preview <file> [options]  Render one post and open it
  colophon eject hugo                Write a Hugo partial that reads the
                                     manifest and emits the meta tags

Images carry a stamp of the props, config and size they came from, so a rebuild
renders only the ones that have actually changed.

Options:
  -c, --config <path>   Load a config module. Its default export is either a
                        ColophonConfig or a function (async or not) returning
                        one, for a config that has to compute something.
  -f, --force           Re-render every image, ignoring the stamps. For init
                        and eject, overwrite a file that is already there
  -o, --overwrite       Alias for --force
  -n, --dry-run         Report what would change and write nothing
  -w, --watch           Rebuild whenever a content file changes
  --concurrency <n>     How many images to render at once
  --size <name>         Which configured size preview renders
  -h, --help            Show this help

Defaults:
  contentDir            content
  --concurrency         one per available CPU
  --size                the first configured size

The first argument is a command where it names one, so a content directory
called init, preview or eject has to be written as ./init.`;
