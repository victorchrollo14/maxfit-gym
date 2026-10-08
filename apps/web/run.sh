#!/usr/bin/env bash
# Usage: ./run.sh build | start | stop | logs
# Values come from apps/web/.env (or the file in $ENV_FILE). The VITE_* ones are
# compiled into the browser bundle at build; the rest are read by the server at
# start from the same file, mounted read-only. Edit it and restart to apply;
# only VITE_* changes need a rebuild. `start` runs it in the background and
# Docker restarts it after a crash or reboot; starting again replaces it.
set -euo pipefail

IMAGE=maxfit-web
CONTAINER=maxfit-web
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="$(realpath "${ENV_FILE:-$ROOT/apps/web/.env}")"

BUILD_VARS=(
  VITE_SUPABASE_URL
  VITE_SUPABASE_PUBLISHABLE_KEY
  VITE_GOOGLE_MAPS_EMBED_KEY
  VITE_PUBLIC_POSTHOG_PROJECT_TOKEN
  VITE_PUBLIC_POSTHOG_HOST
)
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
    load_env
    warn_unset "${BUILD_VARS[@]}"
    args=()
    for v in "${BUILD_VARS[@]}"; do args+=(--build-arg "$v"); done
    docker build -f "$ROOT/apps/web/Dockerfile" -t "$IMAGE" "${args[@]}" "$ROOT"
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
