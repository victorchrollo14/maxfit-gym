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

The publishable key it prints goes in `apps/web` as `VITE_SUPABASE_PUBLISHABLE_KEY`.
Local keys are the same on every machine and are not secret. `db:start` also prints a
legacy `anon` JWT — that still works, but the publishable key is the current one.

Other scripts: `pnpm db:diff` (does the running DB match the migrations?),
`pnpm db:stop`, `pnpm db:push` (apply to the linked remote project).

**Logging in locally.** Two channels, because staff and members sign in differently:
godmode (`/godmode/login`) is **email OTP**, the member portal is **phone OTP**.

Email codes land in Mailpit at <http://127.0.0.1:54324> — sign in as
`victor20030214@gmail.com` and read the six digits there. Phone codes have nowhere
to go without WhatsApp, so they're written to the container logs instead:

```sh
docker logs supabase_auth_backend 2>&1 | grep -i otp | tail -5
```

⚠️ **The Magic Link email template has to carry `{{ .Token }}`.** GoTrue's default
sends a *link*, godmode asks for a *code*, and the code is not recoverable from
anywhere else — not the mail, not the container logs, not `auth.users`. Set it in the
dashboard under Authentication → Emails → Magic Link. This is dashboard state, not
repo state: nothing in `supabase/` configures it, and `db push` never touches it.

Until it is set on a given project, staff sign-in on that project does not work.
Clicking the default link is not a way round it either — the app sets
`detectSessionInUrl: false` and `site_url` points at port 3000, so the link lands
nowhere useful.

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
| Login | `victor20030214@gmail.com` (godmode) / `+919000000001` (portal) — Michael D'Souza, `admin` + `plans_admin` + `claims_admin` |
| Plans | The six sold on the landing page — Monthly ₹2,000, 3 Month ₹4,000, 6 Month ₹6,000, Early Bird ₹8,000, Annual ₹10,000, Couple ₹16,000 (2 seats) |
| Membership | Early Bird, started 30 days ago, one 3-day pause already taken |
| Payment | ₹8,000 UPI, paid and reconciled — balance settles to zero |
| Lead | One `free_trial` lead, status `new` |

## Deploying

`.github/workflows/supabase-migrate.yml` runs `supabase db push` against the linked
project on every push to `main` that touches `supabase/migrations/` or `config.toml`.
Nothing else triggers it, and runs are queued rather than cancelled — two overlapping
pushes are how you get a half-migrated database.

**There is no hosted project yet, so the workflow skips itself** — it checks for
`SUPABASE_PROJECT_ID` first and exits green with a notice if it's missing, rather
than painting `main` red on every push. It starts applying migrations the moment the
secrets exist, with no change to the file. The flip side: if the secrets are ever
deleted, deploys stop silently, and the only clue is the notice on the run.

Three things have to happen first.

**1. Create the project** at supabase.com, in a region near Bengaluru
(`ap-south-1`, Mumbai). Note the project ref from the URL and the database password
you set — you cannot read the password back later.

**2. Add three GitHub secrets** (Settings → Secrets and variables → Actions). The
workflow declares `environment: production`, so put them on that environment if you
want a required reviewer on schema changes, or at repository level if not.

| Secret | Where it comes from |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | supabase.com/dashboard/account/tokens — a personal access token |
| `SUPABASE_PROJECT_ID` | the project ref, e.g. `abcdefghijklmnop` |
| `SUPABASE_DB_PASSWORD` | the database password from step 1 |

**3. Point the web app at it.** In Vercel, set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` from Project Settings → API keys. Both are public and
end up in the browser bundle; RLS is what keeps the publishable key harmless. The
secret / service-role key never goes near Vercel.

**What the workflow deliberately does not do:**

- **No seed.** `db push` applies migrations only. `seed.sql` is the dev dataset and
  must never reach production — that is why there is no `--include-seed`.
- **No edge functions.** There are none yet. When `send-otp` lands, add a
  `supabase functions deploy` step, or a second workflow keyed on `functions/**`.
- **No rollback.** Migrations are forward-only. A bad one is fixed by writing the
  next migration, not by reverting the commit — reverting removes the file but the
  remote history table still says it ran.

⚠️ **This applies schema changes to production the moment they land on `main`,**
and this repo commits straight to `main`. Check `supabase db diff` locally before
pushing anything that touches a table with real data in it.

## Endpoints v1 needs

| Function | What it does |
|---|---|
| `send-otp` | Supabase **Send SMS hook**: delivers the OTP Auth generated, over WhatsApp Cloud API |

`leads` is not on this list any more — the landing page inserts into the table directly
with the publishable key, fenced in by a column-level grant and an insert policy. See
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
  only. The web app gets the publishable key and is fenced in by RLS.

Roles ride in the JWT via `auth.users.raw_app_meta_data`, which only the
service-role key can write — see [PROJECT.md](../../PROJECT.md#roles).
