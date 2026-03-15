#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  echo "Missing .env in $ROOT_DIR" >&2
  exit 1
fi

COMPOSE_FILE="${DEPLOY_COMPOSE_FILE:-docker-compose.prod.yml}"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Missing compose file $COMPOSE_FILE in $ROOT_DIR" >&2
  exit 1
fi

docker compose -f "$COMPOSE_FILE" up -d --build --remove-orphans
