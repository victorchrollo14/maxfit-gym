# web — CRM and API (app.maxfitbangalore.in)

The landing page is a separate static site in [`apps/site`](../site/README.md). `/`
here redirects to `/godmode`.

## Running it

```sh
cp .env.example .env.local     # then fill in the server secrets
pnpm dev
```

The Supabase URL and publishable key are in [`src/config.ts`](src/config.ts) and point
at production. The publishable key is public by design; RLS is what protects the data.

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
from `process.env` there.

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

Every push to `main` deploys on its own (`.github/workflows/deploy.yml`):

1. **Deploy backend** applies any new Supabase migrations.
2. **Build web image** builds this Dockerfile and pushes it to
   `ghcr.io/victorchrollo14/maxfit-web`, tagged with the commit.
3. **Deploy web to EC2** logs into AWS through an IAM role (no stored keys) and, via
   Systems Manager, has the server `git pull`, `docker pull` that image and
   `IMAGE=… ./run.sh start` it. Then it checks `/godmode` answers.

To roll back, run `IMAGE=ghcr.io/victorchrollo14/maxfit-web:<older sha> ./run.sh start`
on the server.

`pnpm build` produces `.output/`, a self-contained Node server (`pnpm start` runs
it). The Dockerfile wraps that, so the same image runs on EC2, ECS or anything else
that runs containers. Build from the repo root:

```sh
docker build -f apps/web/Dockerfile -t maxfit-web .
docker run -d --restart unless-stopped -p 3000:3000 --env-file web.env maxfit-web
```

Server secrets go in `--env-file` at run time and never enter the image.

Hosted Supabase only calls **HTTPS** hooks, and the site needs it anyway: put Caddy or
nginx with Let's Encrypt in front of port 3000.

### Server rendering

Everything under `/godmode` is `ssr: false` (signed-in only, session in
`localStorage`), so it renders in the browser. Anything server-rendered that touches
`window`, `document` or storage has to do it in an effect or an event handler, not
while rendering.
