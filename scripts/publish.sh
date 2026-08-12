#!/usr/bin/env bash
#
# Publish a major release to npm, by hand.
#
#   ./scripts/publish.sh
#
# Everything else goes through the Release workflow in the Actions tab, which
# publishes without a credential ever existing in this repository. This script
# is the one path that workflow deliberately cannot take: .releaserc.yaml fails
# the run rather than letting a `feat!:` subject line publish a 3.0.0, because
# what consumers have to rewrite is a decision for a person.
#
# So it takes no release-type argument. It used to default to a minor, and two
# ways to mint one is exactly the ambiguity this note is about.

set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if [[ $# -gt 0 ]]; then
  echo "publish: takes no arguments; this is the major-release path." >&2
  echo "publish: patches and minors go through the Release workflow." >&2
  exit 1
fi

pnpm install
pnpm lint
pnpm fta
pnpm build:check
pnpm build
pnpm test:coverage
# The tarball rather than the local dist/, which is where a stale build hides:
# `tsc` does not clean its output directory, so a renamed module leaves the old
# file behind and `files: ["dist"]` would publish it.
pnpm pack --dry-run

# `--no-git-tag-version` so the commit and the tag are made below rather than by
# pnpm, which names them its own way.
pnpm version major --no-git-tag-version
version="$(node -p "require('./package.json').version")"

git add package.json
git commit --message "$version"
git tag "v$version"

pnpm login
pnpm publish --access public
git push
git push --tags

# The release notes are not written here and are not held anywhere in this
# repository: they live on the GitHub Release, and the workflow builds them out
# of the commit subjects since the last tag. This path has no semantic-release
# run to do that, so GitHub's own "Generate release notes" does it instead, from
# the same source.
echo
echo "Published $version. Write the release at:"
echo "  https://github.com/KensioSoftware/colophon/releases/new?tag=v$version"
