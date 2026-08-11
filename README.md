# MaxFit — gym website & admin

Landing page, member portal and CRM for MaxFit, a strength and conditioning gym in Bengaluru.

## Docs

| File | What's in it |
|---|---|
| [PROJECT.md](PROJECT.md) | Decisions and their rationale, design direction, stack, costings, open questions |
| [V1.md](V1.md) | What's being built now |
| [LATER.md](LATER.md) | What's deferred, and what would trigger revisiting it |

## Running the site

```bash
cd web
pnpm install
pnpm dev
```

`pnpm build` type-checks and builds; `pnpm lint` runs oxlint.

All landing-page copy, plans and gym details live in a single file — [`web/src/content.ts`](web/src/content.ts). Most content changes need nothing else touched.

## Stack

React 19 + TanStack Router + Vite, HeroUI v3 + Tailwind v4 (dark-first). Supabase for DB and auth, API as Vercel Functions in the same project, Trigger.dev for scheduled jobs — backend not started yet.

Everything ships from one domain and one Vercel deploy: landing page, member portal, CRM and API. See [PROJECT.md](PROJECT.md#decisions-so-far) for why.
