import { Section } from '../components/Section'
import { Cta } from '../components/Cta'
import { FaCheck } from 'react-icons/fa'
import { earlyBird, monthlyAnnualised, plans, type Plan } from '../content'
import { formatINR } from '../lib/format'

/** Savings vs paying the monthly rate for a full year. */
function savingsVsMonthly(plan: Plan) {
  if (plan.period !== 'year') return null
  const saved = monthlyAnnualised - plan.price
  if (saved <= 0) return null
  return { amount: saved, percent: Math.round((saved / monthlyAnnualised) * 100) }
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
      <p className="mt-1.5 text-sm text-muted text-pretty">{plan.tagline}</p>

      <div className="mt-6 flex flex-wrap items-baseline gap-x-2.5">
        {plan.strikePrice && (
          <span className="text-lg text-muted line-through">
            {formatINR(plan.strikePrice)}
          </span>
        )}
        <span className="display-upright text-4xl sm:text-5xl">
          {formatINR(plan.price)}
        </span>
        <span className="eyebrow text-muted">
          /{plan.period === 'year' ? 'year' : 'month'}
        </span>
      </div>

      {savings && (
        <p className="eyebrow mt-3 text-accent">
          Save {formatINR(savings.amount)} — {savings.percent}% off monthly
        </p>
      )}

      {plan.featured && (
        <p className="eyebrow mt-5 inline-flex items-center gap-2 self-start rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-accent">
          <span className="size-1.5 rounded-full bg-accent" />
          Only {earlyBird.seatsLeft} early bird passes left
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-3 text-sm">
            <FaCheck className="mt-1 size-3.5 shrink-0 text-accent" />
            <span className="text-pretty text-muted">{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        <Cta
          href="#enquiry"
          size="md"
          tone={plan.featured ? 'solid' : 'outline'}
          className="w-full"
        >
          {plan.featured ? 'Claim this rate' : `Choose ${plan.name}`}
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
      <div className="grid gap-6 pt-3 lg:grid-cols-3 lg:items-stretch">
        {plans.map((p) => (
          <PlanCard key={p.id} plan={p} />
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
