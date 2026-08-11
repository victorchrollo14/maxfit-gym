# MaxFit — gym website & admin

Landing page, member portal and CRM for MaxFit, a strength and conditioning gym in Bengaluru.

## Docs

| File | What's in it |
|---|---|
| [PROJECT.md](PROJECT.md) | Decisions and their rationale, design direction, stack, costings, open questions |
| [V1.md](V1.md) | What's being built now |
| [LATER.md](LATER.md) | What's deferred, and what would trigger revisiting it |

## Layout

pnpm workspace, two packages:

| Package | What it is | Deploys to |
|---|---|---|
| `apps/web` | Landing page, member portal, CRM, API | Vercel → maxfitbangalore.in |
| `apps/trigger` | Scheduled jobs (expiry reminders) | Trigger.dev — empty placeholder for now |

## Running

```bash
pnpm install
pnpm dev
```

From the root. `pnpm build` type-checks and builds the site; `pnpm lint` runs oxlint across the workspace. Both delegate to `apps/web`, which is the only package with anything in it today.

All landing-page copy, plans and gym details live in a single file — [`apps/web/src/content.ts`](apps/web/src/content.ts). Most content changes need nothing else touched.

## Stack

React 19 + TanStack Router + Vite, HeroUI v3 + Tailwind v4 (dark-first). Supabase for DB and auth, API as Vercel Functions in the same project, Trigger.dev for scheduled jobs — backend not started yet.

Everything ships from one domain and one Vercel deploy: landing page, member portal, CRM and API. See [PROJECT.md](PROJECT.md#decisions-so-far) for why.
