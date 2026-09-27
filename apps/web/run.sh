#!/usr/bin/env bash
# Usage: ./run.sh build | start
# Values come from the exported shell environment.
set -euo pipefail

IMAGE=maxfit-web
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

BUILD_VARS=(
  VITE_SUPABASE_URL
  VITE_SUPABASE_PUBLISHABLE_KEY
  VITE_GOOGLE_MAPS_EMBED_KEY
  VITE_PUBLIC_POSTHOG_PROJECT_TOKEN
  VITE_PUBLIC_POSTHOG_HOST
)
RUNTIME_VARS=(
  SEND_SMS_HOOK_SECRETS
  WHATSAPP_ACCESS_TOKEN
  WHATSAPP_PHONE_NUMBER_ID
  WHATSAPP_OTP_TEMPLATE
  WHATSAPP_OTP_TEMPLATE_LANG
)

warn_unset() {
  for v in "$@"; do
    [[ -n "${!v:-}" ]] || echo "warning: $v is not set" >&2
  done
}

case "${1:-}" in
  build)
    warn_unset "${BUILD_VARS[@]}"
    args=()
    for v in "${BUILD_VARS[@]}"; do args+=(--build-arg "$v"); done
    docker build -f "$ROOT/apps/web/Dockerfile" -t "$IMAGE" "${args[@]}" "$ROOT"
    ;;
  start)
    warn_unset "${RUNTIME_VARS[@]}"
    args=()
    for v in "${RUNTIME_VARS[@]}"; do args+=(-e "$v"); done
    docker run --rm -p "${PORT:-3000}:3000" "${args[@]}" "$IMAGE"
    ;;
  *)
    echo "usage: $0 build | start" >&2
    exit 1
    ;;
esac
