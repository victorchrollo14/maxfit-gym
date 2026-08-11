# trigger — scheduled jobs

Trigger.dev tasks. **Empty placeholder** — the workspace exists so the layout is settled, but nothing runs here yet.

The one job v1 needs is the **expiry reminder**: daily, finds plans expiring within 3 days, sends a WhatsApp message. Spec in [V1.md](../V1.md#5-expiry-reminder-worker).

## Before this can be built

1. A Trigger.dev project — `npx trigger.dev@latest init` here, which needs a project ref from the dashboard and writes `trigger.config.ts`.
2. A verified WABA. Meta business verification gates every WhatsApp feature and is the longest lead time in v1 — see [PROJECT.md](../PROJECT.md#open-questions).

## Two things not to get wrong

- **Compute expiry in IST.** "Expiring in 3 days" evaluated in UTC is off by a day for evening expiries, and the schedule itself is set in UTC.
- **Query Postgres on every run, even when nobody is expiring.** This job doubles as the keep-alive that stops the Supabase free tier pausing after 7 days idle. An early return before the query breaks that silently, during exactly the quiet stretch where it matters.

Sends must be logged to Postgres for idempotency — a retry or redeploy must not message anyone twice. Free-tier log retention is 1 day, so that table is also the only durable record of what went out.
