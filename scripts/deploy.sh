#!/usr/bin/env bash
# Deploy dominion to petterbuilds.com via the shared platform deployer
# (handles RUM injection, SSM contract, sync, and invalidation centrally).
#
# Manual/local counterpart to .github/workflows/deploy.yml — both build a clean
# dist/ (scripts/build-static.sh) and deploy that, so what ships locally matches
# CI. Never deploy the repo root: the platform sync would publish scripts/, docs/
# and other non-runtime files.
set -euo pipefail
cd "$(dirname "$0")/.."
export AWS_PROFILE="${AWS_PROFILE:-private}"
WP="${WEB_PLATFORM_DIR:-$HOME/HobbyProjects/web-platform}"
[ -x "$WP/scripts/deploy-app.sh" ] || { echo "✗ web-platform not found at $WP (set WEB_PLATFORM_DIR)" >&2; exit 1; }
bash "$(dirname "$0")/build-static.sh"
exec "$WP/scripts/deploy-app.sh" dominion "${1:-dist}"
