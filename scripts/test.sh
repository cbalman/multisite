#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Running API tests in Docker..."
docker compose exec -T api pytest -q "$@"
