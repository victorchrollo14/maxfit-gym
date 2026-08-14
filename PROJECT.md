# Max — Gym Website & Admin

Living doc. Ideas get appended as they come in; requirements + plan get refined later.

Last updated: 2026-08-12

## Decisions so far

- **Plans are bought in person at the gym**, not self-serve online. OTP fires at purchase, at the front desk. This is the decision that drives most of the ones below.
- **OTP over WhatsApp** (decided 2026-08-11). ~2,500 OTPs/yr = **₹339/yr all-in**. Skips DLT registration entirely, and the verified phone number unlocks renewal reminders on the same rails. Email OTP stays as the fallback/recovery path — it's ₹0 and already planned.
- **OTP is the only login, delivered via Supabase's Send SMS hook** (decided 2026-08-12). Phone number + six digits for signup, login *and* phone verification — no passwords. Supabase Auth keeps ownership of generating, storing, rate-limiting and verifying the code; our edge function only delivers it, so the channel (WhatsApp Cloud API today, SMS or email if ever needed) is one function's implementation detail rather than an architectural commitment. See [How it's wired](#how-its-wired--supabase-send-sms-hook).
- ~~OTP over email, not SMS~~ — superseded. SMS stays dead either way: DLT is ₹6–12k upfront for a worse channel.
- **UPI is the primary payment method**, via a gateway.
- **Invoices**: generate PDF, store in Cloudinary.
- **Roles**: capability flags in the JWT via `app_metadata` (service-role writable only), read with `has_claim()`.
- **Attendance / check-in tracking**: out of scope for v1.
- **One domain, one Vercel project** (decided 2026-08-11). Landing page, member portal, CRM and API all ship from `maxfitbangalore.in` out of a single deploy. A split to `app.maxfitbangalore.in` was considered and rejected: same-origin removes CORS, cookie-domain and allowlist plumbing entirely, and route-level lazy loading — not a domain boundary — is what keeps CRM code out of the landing page bundle. Explicitly a **test-and-iterate setup**; moving pieces off Vercel later is expected.
- **Scheduled jobs on Trigger.dev** (decided 2026-08-11), not Vercel Cron. Vercel's Hobby cron is daily-only, UTC-only, and fires anywhere within the hour — all three are wrong for an IST expiry reminder.

## Plans

Gym name: **MaxFit**.

| Plan | Price | Notes |
|---|---|---|
| Monthly | ₹2,000 / month | ₹24,000/yr — the anchor the annual plans are sold against |
| Early bird | ₹8,000 / year | Founding-member launch discount, capped at the first 200 members |
| Standard | ₹10,000 / year | The regular annual rate once early bird sells out |

- Early bird is a **limited-seat launch discount**, not an off-peak tier — so the landing page sells it with scarcity (struck-through ₹10,000, seats-claimed bar).
- Annual vs monthly: early bird is **67% off** the monthly rate, standard is **58% off**. That gap is the main pricing argument on the page.
- Seat counter lives in `earlyBird.seatsTaken` in `apps/web/src/content.ts` — needs updating manually until the admin panel owns it.
- Annual-heavy pricing makes UPI AutoPay much less relevant (see [Payments](#payments--upi)).

## Landing page sections

Confirmed by Max:
- Equipment
- Personal trainers
- Video recordings from the gym's own trainers — served as static files from `apps/web/public/videos/`, not Cloudinary
- Customer reviews
- Pricing (the three plans above)

### Design direction

Modelled on the Phoenix Fitness offers page (`apps/web/inspirations/`), applied to our own content:

- Near-black surfaces, vivid red accent, full-bleed red band.
- **No social proof anywhere** — MaxFit is a new gym, so there are no ratings, member counts, reviews or transformations to show. The reference's ratings strip is a call-us band instead (`CallBand.tsx`). Emptying `reviews` / `transformations` in content.ts drops those blocks; emptying both removes the Results section entirely.
- Hero perks run as an infinite left-scrolling marquee, paused for `prefers-reduced-motion`.
- Hero backdrop (`HeroBackdrop.tsx`) is layered CSS — accent glows, angled slashes, diagonal hatch, SVG grain, vignette — with the photo as an optional top layer. It holds up with no photo at all, so the hero never depends on having artwork.
- **Mobile header is logo + hamburger only.** Both CTAs live in the floating bottom bar so they aren't duplicated; the desktop header keeps Call now + Free trial.
- **Header stays solid and sticky, never transparent over the hero.** Tried it; the photo shows through the logo's black field because `mix-blend-lighten` needs an opaque dark surface behind it. Don't re-attempt without a transparent-background logo.
- Icons come from **react-icons** (`fa`, `lu`, `tb`, `md` sets) — no hand-rolled SVG paths.
- Red band carries Call now + Chat on WhatsApp buttons rather than the bare number. WhatsApp deep-links via `wa.me/<gym.whatsapp>` with a prefilled message.
- Headings: heavy oblique uppercase, last word in red italic, over a letterspaced subtitle and a short red rule.
- Display face is **Archivo** — it carries a genuine italic and a width axis, so the oblique is real type rather than a skewed upright. Set at weight 900 / width 92%.
- Lead-capture form sits inside the hero, as on the reference.
- Accent hue is one variable: `--accent` in `apps/web/src/theme.css`, hue 27.50. Change to 52.76 for the original orange.
- Fonts load from the Google Fonts CDN. Self-host them before the PWA offline shell lands, or the shell won't be truly offline.
- **Logo**: `public/logo.jpeg` is the supplied square lockup. It goes illegible at nav height, so `public/logo-wordmark.jpg` is a cropped horizontal MAX FIT GYM lockup derived from it (`magick logo.jpeg -crop 1105x486+59+412 +repage -resize x220`). Nav uses the wordmark, footer the full lockup. Both are black-field JPEGs shown with `mix-blend-lighten`, which needs a **dark** backdrop — they'll break on the red band or any light surface. A transparent PNG/SVG from the designer would remove that constraint.
- **Hero deliberately carries no pricing** — it sells the gym (rating, members, coaches, hours) and the free trial. Plans are the pricing section's job.
- Phone `+91 831 089 0652` drives the nav "Call now" button, the mobile sticky bar, the footer and the Find-us section.

Added on top, as recommended:
- Hero with the trial CTA
- Member transformations (before/after), paired with the reviews
- Location, hours and map
- FAQ (joining fee, lock-in, freezing, PT cost, women's timings, parking)
- Enquiry form — the lead capture that feeds admin Leads
- Sticky mobile CTA bar

## Scope

Split into two files as of 2026-08-11:

- **[V1.md](V1.md)** — what's being built now: landing page + lead capture, `/trial-claimed` page for Google Ads conversions, user accounts with WhatsApp OTP, member portal with plan pausing, daily expiry-reminder worker, CRM (dashboard / leads / members), PostHog — then invoices and the PWA last.
- **[LATER.md](LATER.md)** — what's deferred and why: payment gateway, SMS OTP, UPI AutoPay, attendance.

This file stays the **reference**: decisions and their rationale, design direction, stack, costings, open questions. Scope lives in the other two.

**The one-line version of v1:** a landing page that captures leads, a CRM where the front desk works those leads into members, and a member portal that shows people what they bought. Money is handled in person — no checkout, no gateway.

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + TanStack Router + Vite |
| UI | HeroUI v3 + Tailwind v4, dark-first |
| Type | Archivo (variable — real italic + width axis) for display, Inter for body, via Google Fonts |
| Repo | pnpm workspace monorepo — `apps/web` (site), `apps/backend` (DB + API), `apps/trigger` (scheduled jobs) |
| Backend | **Supabase Edge Functions** in `apps/backend`, see below. Per-endpoint choice, so a Vercel Function can still be used where Node deps or same-origin matter |
| Scheduling | Trigger.dev |
| DB / Auth | Supabase |
| Media | Cloudinary |
| Auth | Supabase Auth, **phone + WhatsApp OTP only, no passwords**. Delivery via a Send SMS hook (Meta Cloud API, own WABA); email OTP as fallback |
| Payments | UPI via gateway — Razorpay or PhonePe PG (TBD) |

Fine for a small gym. Open questions in [Open Questions](#open-questions).

### Vercel Functions vs Supabase Edge Functions

Both are a handler that reads a request and talks to Postgres, so the port is small either way.

| | Vercel Functions | Supabase Edge Functions |
|---|---|---|
| Runtime | Node, same npm deps as the app | Deno — separate dependency world |
| Origin | Same as the site, no CORS | `*.supabase.co`, CORS headers required |
| Timeout | **10s on Hobby** | 150s wall clock, generous by comparison |
| Deploy | Already wired to the repo | Separate CLI step |
| Proximity | Network hop to Supabase | Runs next to the database |

**Supabase Edge Functions, in `apps/backend`** (decided 2026-08-12). The endpoints v1 needs (`leads`, WhatsApp OTP) are far inside 10s either way, so the timeout isn't what settles it — keeping the API out of the web app's Vite build and off Hobby's non-commercial terms is, and it keeps the API in the same place as the schema and the auth it's enforcing. Costs paid for that: CORS on every function, a separate deploy step, and Deno's dependency world.

Still per-endpoint, not global. A Vercel Function is the better answer for anything that wants the app's npm deps (invoice PDFs via pdfkit is the likely first one) or same-origin behaviour; they can coexist.

## Free-tier fit

| Service | Free tier | Verdict |
|---|---|---|
| Supabase | 500 MB DB, 1 GB storage, 50k MAU, 2 projects, **pauses after 7 days inactivity** | Fine on size. Pausing is the risk for a live site — the daily Trigger.dev job queries the DB, so it doubles as the keep-alive |
| Cloudinary | Free credits tier | Fine, gym media is small |
| Hosting | Vercel Hobby — frontend and API in one project | Fine technically. **Hobby forbids commercial use**, so a live gym belongs on Pro ($20/mo) |
| Trigger.dev | $5/mo credits, 20 concurrent runs, **10 schedules**, 1-day log retention, no task timeout | Plenty — v1 needs one schedule. 1-day logs is the real constraint: a failed reminder is invisible by the next day unless we log sends to Postgres ourselves |

Recurring cost is now the plan tiers (Vercel Pro, Supabase Pro if we outgrow free) rather than the payment gateway cut, which in-person selling removes.

## Auth OTP — email (fallback + recovery, cost: ~₹0)

Going email-only avoids **DLT registration** (the TRAI mandate that made SMS cost ₹6–12k upfront + ₹0.15/msg). Dropped entirely.

Supabase Auth sends email OTP / magic links out of the box, but its **built-in SMTP is rate-limited to a couple of emails per hour on free** — unusable for real signups. Need our own SMTP:

| Provider | Free tier | Paid |
|---|---|---|
| Resend | 3,000/mo, 100/day | $20/mo for 50k |
| Brevo | 300/day (9k/mo) | ~₹1,600/mo |

300 members ≈ a few hundred emails/month → **free tier is plenty**.

Email is no longer the primary channel, but it stays for account recovery, for members without WhatsApp, and as the shipping default until the WABA clears verification. It costs nothing to keep.

## Auth OTP — WhatsApp ✅ decided

Priced August 2026. **The messages are nearly free; the platform around them is the cost.** Meta's India rate card charges per delivered template message (per-conversation billing ended July 2025):

| Category | Meta list rate (India domestic) |
|---|---|
| Authentication | **₹0.115 / msg** (~$0.0014) |
| Utility | ₹0.115 / msg |
| Marketing | ₹0.8631 / msg |
| Service (reply inside 24h window) | ₹0 |

Authentication rates held flat in the Jan 2026 update — only marketing went up. Add **18% GST** on everything → **₹0.136 per OTP** delivered.

**Budgeted volume: 2,500 OTPs/yr → ₹339/yr all-in** (2,500 × ₹0.115 = ₹287.50, +18% GST). Renewal reminders on top (~900 utility msgs/yr for 300 annual members) add ~₹123. **Call it ₹500/yr for everything.**

That 2,500 was sized for purchase-time OTP only. **Now that OTP is also the login** ([below](#how-its-wired--supabase-send-sms-hook)), volume tracks sessions, not transactions — 300 members logging in monthly is ~3,600/yr, and sessions are long-lived so it won't be that. Even at 10,000/yr it's ₹1,357. The rate is too low for volume to ever be the deciding factor; what matters is that a **rate limit exists**, so an unthrottled signup form can't be turned into a bill.

The message cost is not a real number and will never drive a decision here. What does is **how you get access**, where the spread is 40×:

| Route | Platform fee | Per-msg | Effort |
|---|---|---|---|
| **Meta Cloud API direct** | ₹0 | Meta list rate | Business verification + 2–6 weeks of integration work |
| **BSP, zero-markup tier** (AiSensy free tier, Whautomate) | ₹0–1,500/mo | list rate, no markup | 24–48h onboarding |
| **BSP, standard** (Wati ~₹2,499/mo, Interakt ~₹999–2,499/mo) | ₹12–30k/yr | +12–26% markup | 24–48h |
| **Twilio Verify** (drop-in for Supabase Auth) | ₹0 | **~₹4.7 / verification** ($0.05 + channel) | hours |

**Chosen route: Meta Cloud API direct, own WABA, no BSP.** At 2,500 msgs/yr a ₹999/mo BSP costs ~₹12,000/yr to deliver ₹339 of messages — ~35× the message cost, for onboarding convenience we only need once. Twilio Verify is worse still (~₹4.7/verification ≈ ₹11,750/yr): its flat per-verification fee is priced for products where OTP volume tracks logins, and ours tracks purchases. If direct integration stalls, fall back to a **₹0-platform-fee BSP tier** (AiSensy free tier, Whautomate) — never a paid tier at this volume.

**Build it for renewal reminders, not just OTP.** 250 annual members at ₹8–10k each means retention is the business, and a verified WhatsApp number is how you reach someone 30 days before expiry. Utility templates are the same ₹0.115 rate on the same WABA, so reminders are ~₹123/yr more. The OTP justifies the number; the reminders justify the project.

### How it’s wired — Supabase Send SMS hook

**We do not build an OTP system. We build a delivery function.** Supabase Auth's **Send SMS hook** lets you replace the SMS provider with your own HTTPS endpoint: Auth still generates the code, stores it, expires it, rate-limits it and verifies it — the hook is handed the finished OTP and the user's phone, and its only job is to get those six digits to the person. Whether that happens over WhatsApp, SMS or anything else is invisible to Auth.

```
client: supabase.auth.signInWithOtp({ phone })
  → Auth generates + stores the OTP
  → POSTs { user, sms: { otp } } to our Send SMS hook  (edge function in apps/backend)
  → hook calls the Meta Cloud API /messages authentication template
client: supabase.auth.verifyOtp({ phone, token, type: 'sms' })
  → Auth verifies against its own store, issues the session
```

Consequences, all of them good:

- **Phone + WhatsApp OTP is the primary way in** — account creation *and* login, not just a purchase-time check. No password to forget, which suits a walk-in gym membership better than email + password ever did.
- **Verifying a phone on an existing account** is the same primitive: `updateUser({ phone })` then `verifyOtp({ …, type: 'phone_change' })`. Same hook, same template, no second code path.
- **Nothing custom to get wrong.** No OTP table, no expiry logic, no verify endpoint, no timing-safe comparison — the parts of a hand-rolled OTP flow where bugs are security bugs are Supabase's.
- **Channel-agnostic falls out of the design.** The channel choice lives inside one function: try WhatsApp, fall back to email or a BSP if it fails. Not an app-level abstraction the client knows about.

**Mechanics that matter when building it:**
- Hook requests are **signed** (`standardwebhooks`, `whsec_…` secret from the Auth dashboard). Verify the signature or the endpoint is an open door to sending arbitrary WhatsApp messages on our WABA.
- Phone auth must be enabled in Auth settings for `signInWithOtp({ phone })` to exist at all; the hook then supersedes the provider config.
- **The hook is synchronous and the caller is waiting** — deliver inline and return, don't queue. Cloud API is fast enough. A non-2xx response surfaces to the user as a failed login.
- **Configure the Auth SMS rate limits deliberately** (per hour, and the per-user resend interval). They're the only thing standing between a scripted signup form and our WABA bill.
- ⚠️ **Verify the hook is available on the free plan before committing** — Supabase has moved auth-hook plan gating around. Fallback if it's Pro-only: keep v1 on email OTP, which is where it's shipping anyway until the WABA clears.

### What this actually costs in work

The money is settled; the effort isn't. Direct Cloud API is **2–6 weeks** end to end, most of it waiting:

1. **Meta business verification** — the long pole. Needs company PAN, GST, a live website, and CIN if Pvt Ltd. Start this first, it gates everything.
2. **WABA + phone number** — must be a number *not* currently on WhatsApp or WhatsApp Business. Don't use the gym's existing `+91 831 089 0652` if it's on WhatsApp today, or you'll lose that account's chat history. Budget for a second SIM.
3. **Authentication template approval** — fixed format (code + copy button), no custom copy, usually approved in hours.
4. **Integration** — one edge function: verify the hook signature, call the Cloud API `/messages` endpoint with the OTP Auth handed us. Supabase's built-in phone provider doesn't speak Cloud API, but the **Send SMS hook** means we only own delivery, not the OTP itself ([above](#how-its-wired--supabase-send-sms-hook)). Days of work, not weeks — the weeks are all Meta's.

**Gotchas that actually decide this:**
- ⚠️ **Meta business verification needs company PAN, GST, a live website, and CIN for Pvt Ltd.** This is the real gate, not the money — and it collides with the open question of whether the gym is even GST-registered. Same paperwork the payment gateway KYC needs, so do them together.
- ⚠️ **The WABA must be registered in India.** Sending to Indian numbers from a non-India WABA hits the *authentication-international* rate of ~₹2.30–2.50/msg — **~22× domestic**. Easy to trip over with an overseas-registered BSP account.
- Authentication templates are a fixed format (code + copy button) and need Meta approval; no custom copy.
- None of this affects the landing page's `wa.me` "Chat on WhatsApp" deep-link — that's a plain link and stays free.

**Sequencing.** Meta business verification is weeks of waiting on Meta, and the landing page ships long before that. The hook makes this easy: ship v1 on Supabase's email OTP, and when the WABA clears, WhatsApp arrives as *one edge function plus a dashboard toggle* — no client change, no rewrite. Keep email as the in-function fallback afterwards, for members without WhatsApp and for the day Cloud API is down.

## Payments — UPI

UPI has **government-mandated 0% MDR** on bank-to-bank transactions. But gateways still charge a platform fee on online checkout, so "0% UPI" marketing is misleading.

| Gateway | UPI rate | Setup | AMC |
|---|---|---|---|
| **PhonePe PG** | 0% UPI (strongest if traffic is UPI-heavy; weak on cards) | ₹0 | ₹0 |
| **Razorpay** | 2% + 18% GST on the fee | ₹0 | ₹0 |
| **Cashfree** | 1.6–1.95% | ₹0 | ₹4,999/yr |

**What 2% actually costs us** — on a ₹1,500 plan: ₹30 fee + ₹5.40 GST = **₹35.40/txn**. 300 members paying monthly → **~₹10,600/mo (₹1.27L/yr)**. That dwarfs every other line item combined.

**Recommendation:** PhonePe PG as primary if their 0% UPI holds up (verify it's not a limited-time promo — one source flagged it as such), Razorpay as fallback/for cards. Worth ~30 min of due diligence given the ₹1L+/yr swing.

**⚠️ In-person selling probably deletes this entire cost line.** A gateway exists to take money from someone who isn't in the room. If every purchase happens at the front desk, a **static UPI QR / VPA is genuinely ₹0** — zero MDR, zero platform fee, no KYC, no integration. Staff watches the payment land, marks it paid in admin. The "cost" is manual reconciliation, which the front desk is already doing for cash.

That's the ~₹1.27L/yr line item in the table above going to zero, which makes it far and away the highest-value decision in this doc — bigger than every other cost question combined, WhatsApp included. The gateway becomes worth revisiting only if self-serve online purchase comes back into scope.

Other notes:
- **UPI AutoPay** for auto-renewing memberships — best per-debit economics in the ₹500–15k range. Worth it if plans are monthly.
- Wallet-funded UPI (PPI) over ₹2,000 carries 1.1% interchange; RuPay credit-on-UPI is 0.5–2%. Minor at our volume.
- Gateway onboarding needs business KYC — see open questions.

## Invoices

Generate PDF → upload to Cloudinary → store the URL on the payment row.

- Server-side generation in a Vercel Function. **Use pdfkit, not puppeteer** — a Chromium binary blows both the 250 MB function bundle limit and the 10s Hobby duration cap. If HTML templating turns out to be worth it, generate on Trigger.dev instead, where there's no timeout.
- If the gym is GST-registered, invoices need GSTIN, HSN/SAC, and tax split — affects the template and the DB schema. Confirm before building.

## Roles

Boolean capability flags in **`auth.users.raw_app_meta_data`**, which Supabase already includes in the access token — so there's no custom access token hook to write or enable. RLS reads them through `has_claim(claim text)`, copied from mytribe, plus a shared guard in the API functions.

- Two flags today: **`admin`** (the CRM — members, memberships, payments) and **`plans_admin`** (writing the plan catalog, i.e. pricing). They are independent — `admin` alone cannot change prices. Everyone signed in can *read* plans, since members need the catalog to renew.
- Members have no flags at all; absence is the default, so nothing is written for them.
- Further splits (`payments_admin`, `owner` for reports) are deferred until there's front-desk staff who shouldn't see revenue. Adding one later is a no-op migration: set the flag on the accounts that need it and swap the claim name in the few policies concerned.
- Not a single `role` string. mytribe started there (`get_my_claim('userrole') = '"ADMIN"'`, still visible as the dead `is_admin()`) and migrated to flags; this matches where it landed, and lets a capability be added later without a data migration.
- **`app_metadata`, never `user_metadata`.** `user_metadata` is writable by the user via `auth.updateUser()`, so a member could promote themselves and RLS would believe it. `app_metadata` is settable only with the service-role key: `auth.admin.updateUserById(id, { app_metadata: { admin: true } })` — and it must be a real boolean, since `has_claim` compares against `'true'::jsonb` and a string `"true"` fails.
- Policies call it as `(select has_claim('admin'))`. The scalar subquery is not cosmetic — it makes Postgres evaluate the claim once per query as an initplan instead of once per row.
- Claims are baked into the JWT at issue time, so a role change doesn't take effect until token refresh. Fine for a gym; just don't build anything that assumes instant revocation.

## Notes / gotchas

- Supabase free tier **pauses after 7 days inactivity** — biggest infra risk for a live site. The daily expiry job on Trigger.dev covers it, provided it actually queries Postgres on days it finds nothing to send.
- Cloudinary free tier is credit-based; gym media (photos, PDFs) won't come close.
- **Vercel Hobby: 10s max function duration.** Fine for leads and OTP sends, not for PDF generation or anything calling a slow third party. Pro raises it; Trigger.dev has no timeout at all.
- **Vercel Hobby is non-commercial.** A revenue-generating gym site is outside the terms, and consolidating the API into the same project puts more on that footing. Pro is $20/mo.
- **The SPA rewrite swallows everything.** `apps/web/vercel.json` rewrites `/(.*)` → `/index.html`. Harmless while the API lives on Supabase, but if a Vercel Function is ever added, exclude it explicitly — `"source": "/((?!api/).*)"` — rather than trusting the filesystem check to win.
- **Trigger.dev keeps 1 day of logs on free.** Reminder sends need to be logged to our own tables regardless — idempotency requires it — but that also becomes the only durable record of what went out.

## Open questions

**Blocking the landing page going live:**
- ⚠️ **The hero form promises a callback "within a few minutes" but does not send anywhere yet** — it only `console.info`s. Wiring the `leads` function (or, as a stopgap, a WhatsApp/email handoff) is now a prerequisite for publishing, not a nice-to-have. The promise also commits someone to actually answering the phone during opening hours.

(All the below are placeholder values in `apps/web/src/content.ts`.)
- Address, phone, email, opening hours, Google Maps embed URL.
- Real photos: **the hero is a Pexels stock shot of another gym** (ID 29392546) and must be swapped for a real MaxFit interior. Trainers and transformations still have no photos at all.
- **Reviews and transformations are still placeholder content** and must not ship as-is. For a brand-new gym the honest move is to empty both arrays until real ones exist — the section then disappears on its own.
- The actual equipment list.
- FAQ answers, especially women's timings and parking (left blank; blank answers are filtered out rather than shown). Freeze policy is confirmed: **15 days a year** for annual members.
- ⚠️ **The equipment copy describes a far bigger gym than 2,000 sq ft** — six power racks, four platforms, a turf track, sleds, a full cardio bank. It's placeholder text I wrote before the size was known and it will read as overselling to anyone who walks in. Needs rewriting against the real kit list.
- Does the ₹8,000 early-bird rate stay locked on renewal, or revert to ₹10,000? The page currently promises it stays locked.

**Rest:**
- ~~PhonePe PG 0% UPI — permanent or promotional?~~ / ~~v1: real online checkout, or static UPI QR?~~ — **both largely answered by selling in person.** Static UPI QR + admin marks paid is the v1 default; gateway due diligence is deferred, not needed. Confirm Max is fine with manual reconciliation at the desk.
- Does the front desk need anything at point-of-sale beyond "record payment" — a printed receipt then and there, card/cash as well as UPI, part payments?
- 🚩 **Is the gym GST-registered, and is it Pvt Ltd or proprietorship?** Now the #1 blocker — Meta business verification needs PAN + GST + live website (+ CIN if Pvt Ltd), and WhatsApp OTP is a committed decision that can't start without it. Also drives invoice format and gateway KYC. **Get these documents from Max before anything else.**
- 🚩 **Is `+91 831 089 0652` currently on WhatsApp or WhatsApp Business?** If yes, it can't become the WABA number without destroying that account — we need a separate number. Cheap to answer, expensive to discover late.
- ~~Do members actually self-serve purchase?~~ — **answered: no, walk-in.** Portal is view-only for money.
- ~~Plans monthly or longer-term?~~ UPI AutoPay is moot — in-person selling and annual-heavy pricing both rule it out.
- What happens at the desk if a member has no WhatsApp, or the OTP doesn't arrive? Email fallback covers it, but staff need a defined path — not an improvised one mid-sale.
- Exact role list beyond owner/staff/member (trainers?).

## Sources

- [Razorpay pricing explained](https://razorpay.com/blog/razorpay-payment-gateway-pricing-explained/)
- [UPI transaction charges & zero MDR (Razorpay)](https://razorpay.com/learn/upi-transaction-charges/)
- [Razorpay vs Cashfree vs PhonePe 2026](https://growwwtech.com/blog/razorpay-vs-cashfree-vs-phonepe-business-india-2026)
- [PhonePe PG pricing (Techjockey)](https://www.techjockey.com/detail/phonepe-payment-gateway)
- [UPI AutoPay recurring billing costs](https://razorpay.com/blog/cheapest-payment-gateway-for-recurring-billing-e-nach-upi-autopay-and-subscription/)
- [Supabase free tier limits 2026](https://uibakery.io/blog/supabase-pricing)
- [Express on Vercel](https://vercel.com/docs/frameworks/backend/express)
- [Vercel Functions limits](https://vercel.com/docs/functions/limitations)
- [Vercel cron usage & pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing) — why scheduling went to Trigger.dev
- [Trigger.dev pricing](https://trigger.dev/pricing)
- [SMS OTP pricing India 2026 (Message Central)](https://www.messagecentral.com/en-in/blog/sms-otp-pricing-india) — kept for reference if SMS comes back
- [WhatsApp API pricing India, Jul 2026 rate card (Whautomate)](https://whautomate.com/whatsapp-business-api-pricing-india) — per-category ₹ rates + BSP markup comparison
- [WhatsApp API pricing explained 2026 (Authgear)](https://www.authgear.com/post/whatsapp-api-pricing/) — the authentication-international trap
- [Twilio Verify pricing & alternatives (Authgear)](https://www.authgear.com/post/twilio-verify-pricing-and-alternatives/)
- [WhatsApp API pricing India, 5 BSPs compared (Codingclave)](https://codingclave.com/guides/whatsapp-api-pricing-india-2026-comparison)
- [Getting WhatsApp Business API in India (Picky Assist)](https://pickyassist.com/blog/how-to-get-whatsapp-api-for-business/) — verification document list
