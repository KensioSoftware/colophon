#!/usr/bin/env bash

# The three linters read the tree and write nothing, and none of them needs
# another's result, so they run at once rather than one after another. ESLint is
# the long pole by some way, and this hides oxlint and oxfmt behind it.
#
# Each one's output is held in a file of its own and printed once they have all
# finished. Three processes writing to the same terminal interleave into
# something unreadable, and the order should not depend on which happened to
# finish first.

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BIN_DIR="${ROOT_DIR}/node_modules/.bin"
OUT_DIR="$(mktemp -d)"

trap 'rm -rf "${OUT_DIR}"' EXIT

cd "${ROOT_DIR}"

NAMES=(oxlint eslint oxfmt)
PIDS=()

"${BIN_DIR}/oxlint" >"${OUT_DIR}/oxlint" 2>&1 &
PIDS+=("$!")

"${BIN_DIR}/eslint" . >"${OUT_DIR}/eslint" 2>&1 &
PIDS+=("$!")

"${BIN_DIR}/oxfmt" --check >"${OUT_DIR}/oxfmt" 2>&1 &
PIDS+=("$!")

STATUS=0

for index in "${!NAMES[@]}"; do
  NAME="${NAMES[index]}"

  if ! wait "${PIDS[index]}"; then
    STATUS=1
  fi

  if [[ -s "${OUT_DIR}/${NAME}" ]]; then
    printf '── %s ──\n' "${NAME}"
    cat "${OUT_DIR}/${NAME}"
    echo
  fi
done

exit "${STATUS}"
