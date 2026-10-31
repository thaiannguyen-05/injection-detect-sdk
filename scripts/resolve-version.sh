#!/usr/bin/env bash
# Resolve dynamic version for publish.
# Usage: resolve-version.sh [input_version] [github_ref]
# Priority:
#  1. workflow_dispatch input version (e.g. 1.2.3) -> publish=true
#  2. git tag ref refs/tags/vX.Y.Z -> version X.Y.Z, publish=true
#  3. fallback dev version 0.0.0-dev.YYYYMMDDHHMM.<shortsha> -> publish=false (dry-run)
set -euo pipefail
INPUT_VER="${1:-}"
GITHUB_REF_IN="${2:-}"

strip_v() { echo "${1#v}"; }

if [[ -n "$INPUT_VER" ]]; then
  VER="$(strip_v "$INPUT_VER")"
  echo "[resolve] using manual input version: $VER"
  npm pkg set "version=$VER"
  echo "published=true" >> "${GITHUB_OUTPUT:-/dev/null}"
  exit 0
fi

if [[ "$GITHUB_REF_IN" == refs/tags/v* ]]; then
  VER="$(strip_v "${GITHUB_REF_IN#refs/tags/}")"
  echo "[resolve] using tag version: $VER"
  npm pkg set "version=$VER"
  echo "published=true" >> "${GITHUB_OUTPUT:-/dev/null}"
  exit 0
fi

SHA="$(git rev-parse --short HEAD 2>/dev/null || echo local)"
STAMP="$(date -u +%Y%m%d%H%M)"
VER="0.0.0-dev.${STAMP}.${SHA}"
echo "[resolve] dev version (no publish): $VER"
npm pkg set "version=$VER"
echo "published=false" >> "${GITHUB_OUTPUT:-/dev/null}"
