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

Deliberately minimal: **one row per table**, enough to boot the app and log in. Test
data is created by hand through the UI, and `pnpm db:reset` puts it back to this.

Plan prices are duplicated in `apps/web/src/content.ts`, which is what the landing
page renders — the site has no plans endpoint yet, so the two have to be changed
together until it does.

| | |
|---|---|
| Login | `+919000000001` — Michael D'Souza, `admin` + `plans_admin` |
| Plans | The five sold on the landing page — Monthly ₹2,000, 3 Month ₹4,000, 6 Month ₹6,000, Early Bird ₹8,000, Annual ₹10,000 |
| Membership | Early Bird, started 30 days ago, one 3-day pause already taken |
| Payment | ₹8,000 UPI, paid and reconciled — balance settles to zero |
| Lead | One `free_trial` lead, status `new` |

## Connecting to a hosted project

`supabase link --project-ref <ref>`, then `pnpm db:push`. Not done yet — there is
no hosted project.

## Endpoints v1 needs

| Function | What it does |
|---|---|
| `send-otp` | Supabase **Send SMS hook**: delivers the OTP Auth generated, over WhatsApp Cloud API |

`leads` is not on this list any more — the landing page inserts into the table directly
with the anon key, fenced in by a column-level grant and an insert policy. See
[V1.md](../../V1.md#leads-without-an-endpoint).

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
