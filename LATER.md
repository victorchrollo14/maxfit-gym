# Later — deferred past v1

Deferred 2026-08-11. The rule for this list: **it costs money we don't have yet, or it solves a problem we don't have yet.** Currently building → [V1.md](V1.md). Rationale and costings → [PROJECT.md](PROJECT.md).

---

## Payment gateway integration

Razorpay / PhonePe PG / Cashfree. Deferred because plans are sold in person, and a gateway exists to take money from someone who isn't in the room.

- **Cost avoided: ~₹1.27L/yr** at 2% on 300 monthly members — the single largest line item in the whole project, larger than everything else combined.
- **What we do instead:** static UPI QR / VPA at the front desk. Genuinely ₹0 — no MDR, no platform fee, no KYC, no integration. Staff watches the payment land and marks it paid in admin.
- **Cost of that:** manual reconciliation, which the desk already does for cash.
- **Trigger to revisit:** self-serve online purchase comes back into scope, or reconciliation volume starts eating real staff time.
- **When it does:** PhonePe PG's 0% UPI needs verifying as permanent vs promotional — one source flagged it as a limited-time offer. That's ~30 min of due diligence on a ₹1L+/yr swing.

## SMS OTP

Deferred indefinitely — WhatsApp OTP won on cost and does the same job.

- DLT registration is **₹6–12k upfront** plus ₹0.15/msg, versus ₹339/yr for 2,500 WhatsApp OTPs.
- Worth reconsidering only if WhatsApp delivery proves unreliable in practice, or a meaningful share of members turn out not to use WhatsApp. Neither is likely for an Indian gym, but the member base will tell us.

## UPI AutoPay

Moot on two counts: in-person selling, and annual-heavy pricing. Auto-renew only pays off for monthly plans bought online. Revisit only if both change.

## Attendance / check-in tracking

Out of scope from the start. The obvious v2 feature once members are actually in the system, and the natural pairing with a PWA on members' phones.

## Later-but-cheap, worth queuing

- **WhatsApp beyond OTP + expiry reminders** — payment receipts, class/timing announcements, win-back messages to lapsed members. Same WABA, same ₹0.115 utility rate, near-zero marginal cost once v1's verification clears. Marketing templates are 7.5× the price (₹0.8631) — keep messaging in the utility/authentication categories.
- **Reviews and transformations sections** — the components exist and self-hide while the arrays are empty. Purely waiting on real content from a gym that doesn't have members yet.
- **Fuller role model** — v1 ships `member` / `staff` / `owner`. Trainers as a distinct role is unresolved and can wait until someone asks for it.
