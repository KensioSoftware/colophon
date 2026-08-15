#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SRC_DIR="${ROOT_DIR}/src"

THRESHOLD=50

# fta.json sets score_cap as a failsafe for bare `fta` invocations, but it makes
# FTA itself exit non-zero and print no JSON at all once a file breaches it,
# which would abort this script before the findings below are reported. Restore
# FTA's own default cap for our runs so the threshold check here stays the one
# that decides the outcome.
NO_CAP=(--score-cap 1000)

# Always print the normal FTA table output for humans / CI logs.
fta "${SRC_DIR}" --config-path "${ROOT_DIR}/fta.json" "${NO_CAP[@]}"

# Use JSON output to find files that violate the threshold.
FINDINGS="$(
  fta "${SRC_DIR}" --config-path "${ROOT_DIR}/fta.json" "${NO_CAP[@]}" --json |
    jq --argjson threshold "${THRESHOLD}" '
      map(select(.fta_score >= $threshold))
      | sort_by(.fta_score)
      | reverse
    '
)"

FINDING_COUNT="$(jq 'length' <<<"${FINDINGS}")"

if [[ "${FINDING_COUNT}" -gt 0 ]]; then
  echo
  echo "Found ${FINDING_COUNT} file(s) with FTA score >= ${THRESHOLD}."
  echo
  echo "FTA findings:"
  jq '.' <<<"${FINDINGS}"
  exit 1
fi

echo
echo "All ${SRC_DIR}/**/*.ts files are under FTA threshold of ${THRESHOLD}."
