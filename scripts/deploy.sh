#!/usr/bin/env bash
# Deploy dominion to petterbuilds.com via the shared platform deployer
# (handles RUM injection, SSM contract, sync, and invalidation centrally).
set -euo pipefail
cd "$(dirname "$0")/.."
export AWS_PROFILE="${AWS_PROFILE:-private}"
WP="${WEB_PLATFORM_DIR:-$HOME/HobbyProjects/web-platform}"
[ -x "$WP/scripts/deploy-app.sh" ] || { echo "✗ web-platform not found at $WP (set WEB_PLATFORM_DIR)" >&2; exit 1; }
exec "$WP/scripts/deploy-app.sh" dominion "${1:-.}"
