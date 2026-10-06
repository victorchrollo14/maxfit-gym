# Build from the repo root, where the lockfile lives:
#   docker build -f apps/web/Dockerfile -t maxfit-web \
#     --build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=... .

FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter web

# VITE_* values are compiled into the browser bundle, so they're needed here, not at runtime.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_GOOGLE_MAPS_EMBED_KEY
ARG VITE_PUBLIC_POSTHOG_PROJECT_TOKEN
ARG VITE_PUBLIC_POSTHOG_HOST

COPY apps/web apps/web
RUN pnpm --filter web build

# .output is self-contained: the server bundles the node_modules it needs.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /repo/apps/web/.output .output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
