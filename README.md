# MaxFit — gym website & admin

Landing page, member portal and CRM for MaxFit, a strength and conditioning gym in Bengaluru.

## Layout

pnpm workspace, three packages:

| Package | What it is | Deploys to |
|---|---|---|
| `apps/web` | Landing page, member portal, CRM, and the API routes (TanStack Start) | Docker on AWS EC2 → maxfitbangalore.in |
| `apps/backend` | DB schema, migrations, local Supabase stack | Supabase |
| `apps/trigger` | Scheduled jobs (expiry reminders) | Trigger.dev — empty placeholder for now |

## Running

```bash
pnpm install
pnpm dev
```

From the root. `pnpm build` type-checks and builds the site; `pnpm lint` runs oxlint across the workspace. Both delegate to `apps/web`, which is the only package with running code today. `apps/backend` is driven by the Supabase CLI instead — see [its README](apps/backend/README.md).

All landing-page copy, plans and gym details live in a single file — [`apps/web/src/content.ts`](apps/web/src/content.ts). Most content changes need nothing else touched.

## Stack

React 19 + TanStack Start + Vite, HeroUI v3 + Tailwind v4 (dark-first). Supabase for DB and auth, Trigger.dev for scheduled jobs.

Everything ships from one domain as one Node server: landing page, member portal, CRM and the API. See [apps/web/README.md](apps/web/README.md) for the API routes and deploying.
