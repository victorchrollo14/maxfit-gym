import { HeroBackdrop } from '../components/HeroBackdrop'
import { EnquiryForm } from './EnquiryForm'
import { gym } from '../content'

const perks = [
  'Free fitness assessment',
  'Coaches on the floor',
  'Open from 6am, 7 days',
  'Lockers & showers',
  'Personal training',
  'No crowds at peak hour',
]

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <HeroBackdrop />

      {/* Top padding clears the fixed header (~68px mobile, ~66px desktop) on
          top of the hero's own spacing — the header no longer takes up flow. */}
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pt-28 pb-16 sm:pt-36 sm:pb-24 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16">
        {/* min-w-0: grid items default to min-width:auto, so the marquee's
            w-max track below would otherwise stretch this column to its full
            unclipped width. */}
        <div className="min-w-0">
          <h1>
            <span className="display block text-4xl sm:text-6xl lg:text-7xl">
              <span className="inline-block bg-accent px-3 py-1 text-accent-foreground shadow-[0_8px_40px_-10px_var(--color-accent)]">
                {gym.hero.boxed}
              </span>{' '}
              {gym.hero.rest}
            </span>
            <span className="display text-outline mt-2 block text-4xl sm:text-6xl lg:text-7xl">
              {gym.hero.outline}
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base text-muted text-pretty sm:text-lg">
            {gym.intro}
          </p>

          <div className="relative mt-9 overflow-hidden border-y border-border py-4 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
            <div className="flex w-max animate-marquee motion-reduce:animate-none">
              {[0, 1].map((copy) => (
                <ul key={copy} className="flex" aria-hidden={copy === 1}>
                  {perks.map((p) => (
                    <li
                      key={p}
                      className="eyebrow flex shrink-0 items-center gap-2.5 pr-10 text-muted"
                    >
                      <span className="size-1.5 shrink-0 rotate-45 bg-accent" />
                      {p}
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>

        {/* Lead capture sits in the hero, as on the reference offers page. */}
        <div
          id="enquiry"
          className="scroll-mt-24 rounded-2xl border border-border bg-surface/80 p-6 shadow-2xl backdrop-blur sm:p-7"
        >
          <h2 className="display text-xl sm:text-2xl">
            Claim your <span className="text-accent">free trial</span>
          </h2>
          <p className="mt-2 mb-6 text-sm text-muted text-pretty">
            One session on us. No card details, no obligation — we'll call you back
            within minutes to book your walk-in.
          </p>
          <EnquiryForm />
        </div>
      </div>
    </section>
  )
}
