#!/usr/bin/env bash
# Usage: ./run.sh build | start | stop | logs   (IMAGE=... start runs that image)
# The server's secrets come from apps/web/.env (or the file in $ENV_FILE),
# mounted read-only at start. Edit it and restart to apply. `start` runs it in
# the background and Docker restarts it after a crash or reboot; starting again
# replaces it.
set -euo pipefail

IMAGE="${IMAGE:-maxfit-web}"
CONTAINER=maxfit-web
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="$(realpath "${ENV_FILE:-$ROOT/apps/web/.env}")"

RUNTIME_VARS=(
  SUPABASE_SECRET_KEY
  SEND_SMS_HOOK_SECRETS
  WHATSAPP_ACCESS_TOKEN
)

# KEY=value lines; blank lines and comments skipped, surrounding quotes dropped.
load_env() {
  local line key value
  [[ -f "$ENV_FILE" ]] || { echo "error: $ENV_FILE not found" >&2; exit 1; }
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*(#|$) ]] && continue
    key="${line%%=*}"
    value="${line#*=}"
    [[ "$value" =~ ^\"(.*)\"$ || "$value" =~ ^\'(.*)\'$ ]] && value="${BASH_REMATCH[1]}"
    export "$key=$value"
  done < "$ENV_FILE"
}

warn_unset() {
  for v in "$@"; do
    [[ -n "${!v:-}" ]] || echo "warning: $v is not set in $ENV_FILE" >&2
  done
}

case "${1:-}" in
  build)
    docker build -f "$ROOT/apps/web/Dockerfile" -t "$IMAGE" "$ROOT"
    ;;
  start)
    load_env
    warn_unset "${RUNTIME_VARS[@]}"
    docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
    docker run -d --name "$CONTAINER" --restart unless-stopped \
      -p "${PORT:-3000}:3000" -v "$ENV_FILE:/app/.env:ro" "$IMAGE"
    echo "started $CONTAINER on port ${PORT:-3000}; ./run.sh logs to follow it"
    ;;
  stop)
    docker rm -f "$CONTAINER"
    ;;
  logs)
    docker logs -f --tail 100 "$CONTAINER"
    ;;
  *)
    echo "usage: $0 build | start | stop | logs" >&2
    exit 1
    ;;
esac
