# MaxFit — gym website & admin

Landing page and CRM for MaxFit, a strength and conditioning gym in Bengaluru.

## Layout

pnpm workspace:

| Package | What it is | Deploys to |
|---|---|---|
| `apps/site` | Landing page — one static HTML file + Tailwind | Vercel → maxfitbangalore.in |
| `apps/web` | CRM and the API routes (TanStack Start) | Docker on AWS EC2 → app.maxfitbangalore.in |
| `apps/backend` | DB schema, migrations, local Supabase stack | Supabase |
| `apps/trigger` | Scheduled jobs (expiry reminders) | Trigger.dev — empty placeholder for now |

## Running

```bash
pnpm install
pnpm dev
```

From the root, `pnpm dev` and `pnpm build` run the CRM (`apps/web`); `pnpm --filter site dev` runs the landing page. `pnpm lint` runs oxlint across the workspace. `apps/backend` is driven by the Supabase CLI instead — see [its README](apps/backend/README.md).

Landing-page copy, plans and gym details are written straight into [`apps/site/index.html`](apps/site/index.html).

## Stack

React 19 + TanStack Start + Vite, HeroUI v3 + Tailwind v4 (dark-first). Supabase for DB and auth, Trigger.dev for scheduled jobs.

The landing page is static files on Vercel; the CRM and API are one Node server on EC2. See [apps/web/README.md](apps/web/README.md) for the API routes and deploying.
