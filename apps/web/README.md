# web — landing page, member portal, CRM

## Running it

```sh
cp .env.example .env.local     # then fill in VITE_SUPABASE_PUBLISHABLE_KEY
pnpm dev
```

The free-trial form writes to the `leads` table with the Supabase client, so it needs
a database to talk to. `cd ../backend && pnpm db:start` prints both env values; see
[apps/backend/README.md](../backend/README.md). Without them the site still renders —
the form is the only thing that fails, loudly, in the console.

## API routes

The site is TanStack Start, so the API lives here too, as server routes under
`src/routes/api/`. A file's path is its URL, and its handlers take a `Request` and
return a `Response`:

```ts
// src/routes/api/hello.ts  →  GET /api/hello
export const Route = createFileRoute('/api/hello')({
  server: { handlers: { GET: () => Response.json({ ok: true }) } },
})
```

Server-only code (anything touching secrets) goes in `src/server/`. Read secrets
from `process.env` there. Variables without the `VITE_` prefix never reach the
browser.

| Route | What it does |
|---|---|
| `POST /api/webhooks/send-wa-otp` | Supabase **Send SMS hook**: delivers the OTP Auth generated, over WhatsApp Cloud API |

### The Send SMS hook

Our code never calls it — Supabase Auth does. It owns *delivery only*: Auth still
generates, stores, rate-limits and verifies the code. It fires for every phone OTP
Auth sends, and `sms.sms_type` says which:

| Client call | `sms_type` |
|---|---|
| `signInWithOtp({ phone })` | `sms` |
| `signUp({ phone, password })` | `signup` |
| `updateUser({ phone })` — verifying a number on a signed-in account | `phone_change` |
| `reauthenticate()` | `reauthentication` |

It must **verify the Standard Webhooks signature** (an unsigned endpoint lets anyone
send WhatsApp messages on our WABA) and **answer within 5s**, because the sign-in is
blocked on its response.

To turn it on, once the WABA, phone number and authentication template are approved:

1. Set the server-only variables from `.env.example` in the container's env.
   `SEND_SMS_HOOK_SECRETS` comes from step 2.
2. In Supabase: Authentication → Hooks → Send SMS → HTTP, URL
   `https://maxfitbangalore.in/api/webhooks/send-wa-otp`. Generate the secret there. Phone
   auth has to be enabled under Sign In / Providers too.
3. Set the SMS rate limits (Authentication → Rate Limits). They're the only thing
   between a scripted login form and the WABA bill.

Locally the hook is off (`[auth.hook.send_sms]` in `apps/backend/supabase/config.toml`,
already pointed at `host.docker.internal:5173`). CLI 2.114 leaves
`GOTRUE_EXTERNAL_PHONE_ENABLED` false whatever `[auth.sms]` says, so local phone
sign-in currently fails with `phone_provider_disabled` even with the hook on.

## Deploying

Pushes to `main` that touch `apps/web` deploy on their own: `.github/workflows/deploy.yml`
builds the image in GitHub Actions, pushes it to `ghcr.io/<owner>/maxfit-web:<commit>`,
and runs `./apps/web/run.sh deploy <image>` on the EC2 machine over SSH. That starts the
new image and switches back to the previous one if `/godmode` doesn't answer. To roll back
by hand, `./apps/web/run.sh start ghcr.io/<owner>/maxfit-web:<older commit>`.

`pnpm build` produces `.output/`, a self-contained Node server (`pnpm start` runs
it). The Dockerfile wraps that, so the same image runs on EC2, ECS or anything else
that runs containers. Build from the repo root:

```sh
docker build -f apps/web/Dockerfile -t maxfit-web \
  --build-arg VITE_SUPABASE_URL=... \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=... \
  --build-arg VITE_PUBLIC_POSTHOG_PROJECT_TOKEN=... \
  --build-arg VITE_PUBLIC_POSTHOG_HOST=... \
  --build-arg VITE_GOOGLE_MAPS_EMBED_KEY=... .

docker run -d --restart unless-stopped -p 3000:3000 --env-file web.env maxfit-web
```

`VITE_*` values are compiled into the browser bundle, so they're build args.
Server-only secrets go in `--env-file` at run time and never enter the image.

Hosted Supabase only calls **HTTPS** hooks, and the site needs it anyway: put Caddy or
nginx with Let's Encrypt in front of port 3000.

### Server rendering

Pages are server-rendered, except `/trial-claimed` (its gate reads
`sessionStorage`) and everything under `/godmode` (signed-in only, session in
`localStorage`). Those are `ssr: false` and render in the browser. Anything else that
touches `window`, `document` or storage has to do it in an effect or an event
handler, not while rendering.
