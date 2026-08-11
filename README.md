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

React 19 + TanStack Router + Vite, HeroUI v3 + Tailwind v4 (dark-first). Backend is Express + Supabase; not started yet.
