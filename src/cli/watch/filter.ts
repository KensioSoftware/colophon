/**
 * Whether a change under the content root is one worth rebuilding for.
 *
 * Two kinds of change arrive that are not content. The images themselves: the
 * default placement writes a PNG next to the post it came from, so every build
 * changes the tree it is watching. And an editor's own files, such as
 * `post.md~` or `.post.md.swp`, which come and go around the real write.
 *
 * Both are ruled out by the extensions a walk would read, which is the same
 * list that decides what a build looks at. So the watcher and the build agree
 * on what content is, rather than keeping two ideas of it.
 */
export function isContentChange(
  filename: string,
  extensions: readonly string[],
): boolean {
  return extensions.some((extension) => filename.endsWith(extension));
}
