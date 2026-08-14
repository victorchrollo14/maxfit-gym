# backend — Supabase

The database and the API. Kept out of `apps/web` on purpose: the functions run on
Deno with their own dependency world and their own deploy step, so mixing them
into the Vite app's `package.json` and build only buys confusion.

```
supabase/config.toml   local stack config, written by `supabase init`
supabase/migrations/   schema, in order
supabase/seed.sql      dev data, re-applied on every `db:reset`
supabase/functions/    edge functions (Deno), one directory per endpoint — empty for now
```

## Running it locally

Needs Docker running. Nothing else — the CLI is a devDependency, so `pnpm` finds it.

```sh
pnpm install
cd apps/backend
pnpm db:start     # first run pulls ~10 images, takes a few minutes
pnpm db:reset     # re-apply migrations + seed; the one you'll use constantly
```

`db:start` prints the URLs and keys. The two that matter:

| | |
|---|---|
| API | `http://127.0.0.1:54321` |
| Studio (table browser, SQL editor) | `http://127.0.0.1:54323` |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Mailpit (catches outbound mail) | `http://127.0.0.1:54324` |

The anon key it prints goes in `apps/web` as `VITE_SUPABASE_ANON_KEY`. Local keys are
the same on every machine and are not secret.

Other scripts: `pnpm db:diff` (does the running DB match the migrations?),
`pnpm db:stop`, `pnpm db:push` (apply to the linked remote project).

**Logging in locally.** Auth is phone OTP and there's no WhatsApp in the local stack,
so the code is written to the container logs instead of sent:

```sh
docker logs supabase_auth_backend 2>&1 | grep -i otp | tail -5
```

### Persistence

- `db:stop` / `db:start` — **data survives**. It lives in the `supabase_db_backend`
  Docker volume, so it also survives reboots and Docker restarts.
- `db:reset` — **wipes everything**, re-runs the migrations, re-runs `seed.sql`.
  This is the normal loop while the schema is moving.
- `supabase stop --no-backup` — deletes the volume. The only way to lose data by accident.

So the seed is not a one-off import: treat `seed.sql` as the definition of your dev
dataset, and get back to a known state with `pnpm db:reset` whenever testing has made
a mess.

### Seed data

13 users, 6 plans, 11 memberships. Phone numbers are the logins; all dates are
relative to today, so the interesting states stay interesting however long from now
you reset.

| Phone | Who | State |
|---|---|---|
| `…001` | Michael D'Souza | `admin` + `plans_admin` — the only one who can change pricing |
| `…002` | Lakshmi | `admin` — front desk, deliberately *cannot* touch plans |
| `…003` | Ravi Kumar | annual couple, **paused right now**, 5/15 days used |
| `…004` | Priya Kumar | same couple membership, same pause |
| `…005` | Suresh Nair | monthly, **expires in 2 days** → in the reminder window |
| `…006` | Anita Rao | annual, renewed once — has membership history |
| `…007` | Vikram Shetty | **lapsed 11 days ago** — the win-back case |
| `…008` | Meera Joseph | quarterly, expires in 6 days |
| `…009` | Karthik B | **phone never verified** (desk-enrolled), plus a cancelled couple seat |
| `…010` | Deepa Menon | annual, 11/15 pause days used across two past pauses, one resumed early |
| `…011` | Rohan Gupta | **part-paid** (₹1000 of ₹2000) and already holds next month's renewal |
| `…012` | Sneha Iyer | half-yearly with a **pending** payment awaiting desk verification |
| `…013` | Arjun Pillai | couple plan with a cancelled partner, **pause allowance fully spent** |

Payments cover every branch: UPI reconciled, card **unreconciled** (the worklist),
cash, pending, partial and refunded. Rohan is the case that proves `expiring_soon`
excludes anyone who has already bought their next term.

## Connecting to a hosted project

`supabase link --project-ref <ref>`, then `pnpm db:push`. Not done yet — there is
no hosted project.

## Endpoints v1 needs

| Function | What it does |
|---|---|
| `leads` | `POST` from both landing-page forms — the standing blocker on publishing |
| `send-otp` | Supabase **Send SMS hook**: delivers the OTP Auth generated, over WhatsApp Cloud API |

Specs in [V1.md](../../V1.md). `send-otp` is not called by our own code — Supabase Auth
calls it. It owns *delivery only*; Auth still generates, stores, rate-limits and verifies
the code. Two things it must do: **verify the `standardwebhooks` signature** (an unsigned
endpoint lets anyone send WhatsApp messages on our WABA) and **return synchronously**,
because a login is blocked on its response.

## Two things not to get wrong

- **CORS.** These are served from `*.supabase.co`, a different origin from the
  site, so every function needs the preflight handler and the `Access-Control-*`
  headers. The Vercel-function version of this API wouldn't have — that's the
  cost of the split, and it's one shared helper.
- **The service-role key never reaches the browser.** It lives in function env
  only. The web app gets the anon key and is fenced in by RLS.

Roles ride in the JWT via `auth.users.raw_app_meta_data`, which only the
service-role key can write — see [PROJECT.md](../../PROJECT.md#roles).
