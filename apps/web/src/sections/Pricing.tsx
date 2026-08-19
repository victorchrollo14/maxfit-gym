import { Section } from '../components/Section'
import { Cta } from '../components/Cta'
import { FaWhatsapp } from 'react-icons/fa'
import {
  gym,
  monthlyRate,
  periodLabel,
  periodMonths,
  plans,
  type Plan,
} from '../content'
import { formatINR } from '../lib/format'
import { whatsappHref } from '../lib/links'

/** Savings vs paying the monthly rate for the same stretch of time. */
function savingsVsMonthly(plan: Plan) {
  const months = periodMonths[plan.period]
  if (months === 1) return null
  const atMonthly = monthlyRate * months
  const saved = atMonthly - plan.price
  if (saved <= 0) return null
  return { amount: saved, percent: Math.round((saved / atMonthly) * 100) }
}

/**
 * "3 MONTH PASS … ₹4,000 /3 months" stutters. The suffix only earns its place
 * on a plan whose name doesn't already state the term — Early Bird, say.
 */
function nameStatesTerm(plan: Plan) {
  return /month|annual|year/i.test(plan.name)
}

function PlanCard({ plan }: { plan: Plan }) {
  const savings = savingsVsMonthly(plan)

  return (
    <article
      className={`relative flex h-full flex-col rounded-2xl border p-6 sm:p-7 ${
        plan.featured
          ? 'border-accent bg-linear-to-b from-accent/12 to-surface shadow-[0_0_60px_-25px_var(--color-accent)]'
          : 'border-border bg-surface'
      }`}
    >
      {plan.badge && (
        <span className="display absolute -top-3 left-6 rounded-full bg-accent px-3.5 py-1 text-[0.65rem] text-accent-foreground">
          {plan.badge}
        </span>
      )}

      <h3 className="display text-2xl">{plan.name}</h3>
      {/* Fixed heights so the price and savings rows line up across cards
          whatever the tagline wraps to, and whether or not a plan saves
          anything — Monthly is the rate everything else is measured against,
          so it never does. */}
      <p className="mt-1.5 min-h-10 text-sm text-muted text-pretty">
        {plan.tagline}
      </p>

      <div className="mt-6 flex flex-wrap items-baseline gap-x-2.5">
        {plan.strikePrice && (
          <span className="text-lg text-muted line-through">
            {formatINR(plan.strikePrice)}
          </span>
        )}
        <span className="display text-4xl sm:text-5xl">
          {formatINR(plan.price)}
        </span>
        {!nameStatesTerm(plan) && (
          <span className="eyebrow text-muted">/{periodLabel[plan.period]}</span>
        )}
      </div>

      <p className="eyebrow mt-3 min-h-4 text-accent">
        {savings &&
          `Save ${formatINR(savings.amount)} — ${savings.percent}% off monthly`}
      </p>

      {/* Plans are sold in person, so the card hands the conversation to
          WhatsApp with the plan already named rather than to a form. */}
      <div className="mt-auto pt-8">
        <Cta
          href={whatsappHref(
            `Hi ${gym.name}, I'd like to enquire about the ${plan.name} (${formatINR(
              plan.price,
            )} / ${periodLabel[plan.period]}).`,
          )}
          external
          size="md"
          tone={plan.featured ? 'solid' : 'outline'}
          className="w-full"
        >
          <FaWhatsapp className="size-4" aria-hidden="true" />
          Enquire now
        </Cta>
      </div>
    </article>
  )
}

export function Pricing() {
  return (
    <Section
      id="pricing"
      lead="Membership"
      accent="Plans"
      sub="No joining fee. No hidden charges. Cancel monthly any time."
    >
      {/* Flex rather than grid: with five plans the last row is short, and
          wrapping flex items centre it instead of leaving a hole on the right. */}
      <div className="flex flex-wrap justify-center gap-6 pt-3">
        {plans.map((p) => (
          <div
            key={p.id}
            className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
          >
            <PlanCard plan={p} />
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-muted">
        Pay by UPI online or at the front desk.{' '}
        <a href="#faq" className="text-foreground underline underline-offset-4">
          Questions about lock-in and freezing?
        </a>
      </p>
    </Section>
  )
}
