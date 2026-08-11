import { useEffect } from 'react'
import { FaPhoneAlt, FaWhatsapp } from 'react-icons/fa'
import { LuCheck, LuClock, LuMapPin } from 'react-icons/lu'
import { Cta } from '../components/Cta'
import { HeroBackdrop } from '../components/HeroBackdrop'
import { Logo } from '../components/Logo'
import { gym } from '../content'

const telHref = `tel:${gym.phone.replace(/\s/g, '')}`
const waHref = `https://wa.me/${gym.whatsapp}?text=${encodeURIComponent(
  `Hi ${gym.name}, I just claimed the free trial on your website.`,
)}`

/**
 * Post-submit confirmation for the hero / enquiry free-trial forms.
 *
 * This page exists as much for Google Ads as for the member: Ads counts a lead
 * conversion off a destination URL, so it has to be a real navigation rather
 * than swapping the form out in place.
 *
 * Not linked from anywhere yet — the forms still only `console.info`. Two
 * things to add when `POST /api/leads` lands:
 *   1. Redirect here on submit success.
 *   2. Gate it on a flag set by that redirect. Reachable by bookmark or
 *      refresh means Ads double-counts and cost-per-lead reads low.
 */
export function TrialClaimed() {
  /* No head manager in the app, and this is the only route that needs to differ
     from index.html — a bare effect is less machinery than adding one. */
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)

    const previousTitle = document.title
    document.title = `Free trial claimed — ${gym.name} Gym`

    return () => {
      meta.remove()
      document.title = previousTitle
    }
  }, [])

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-background text-foreground">
      <HeroBackdrop />

      <main className="relative mx-auto w-full max-w-2xl px-5 py-16 text-center sm:py-20">
        <a href="/" aria-label={`${gym.name} home`} className="inline-block">
          <Logo className="h-10 sm:h-12" />
        </a>

        <div className="mx-auto mt-12 grid size-16 place-items-center rounded-full bg-accent text-accent-foreground shadow-[0_8px_40px_-8px_var(--color-accent)]">
          <LuCheck className="size-8" aria-hidden="true" strokeWidth={3} />
        </div>

        <p className="eyebrow mt-8 text-accent">You're in</p>
        <h1 className="display-upright mt-4 text-4xl sm:text-5xl md:text-6xl">
          Free trial{' '}
          <span className="display ml-[0.12em] text-accent">claimed.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-md text-pretty text-muted">
          We've got your details. There's nothing to book and nothing to print —
          just walk in during opening hours, tell the front desk your name, and
          they'll set you up.
        </p>

        <div className="mx-auto mt-10 grid max-w-md gap-px overflow-hidden rounded-xl border border-border bg-border text-left">
          <div className="bg-surface p-5">
            <p className="eyebrow flex items-center gap-2.5 text-muted">
              <LuClock className="size-3.5 text-accent" aria-hidden="true" />
              Opening hours
            </p>
            <dl className="mt-3 divide-y divide-border">
              {gym.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-4 py-2">
                  <dt className="text-sm text-muted">{h.days}</dt>
                  <dd className="text-sm">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="bg-surface p-5">
            <p className="eyebrow flex items-center gap-2.5 text-muted">
              <LuMapPin className="size-3.5 text-accent" aria-hidden="true" />
              Where we are
            </p>
            <address className="mt-3 text-sm not-italic">
              <p>{gym.address.line1}</p>
              <p className="text-muted">{gym.address.line2}</p>
            </address>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-md text-sm text-muted">
          Bring trainers and a water bottle. That's it.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Cta href={telHref} size="lg">
            <FaPhoneAlt className="size-4" aria-hidden="true" />
            Call {gym.phone}
          </Cta>
          <Cta href={waHref} size="lg" tone="outline">
            <FaWhatsapp className="size-5" aria-hidden="true" />
            Chat on WhatsApp
          </Cta>
        </div>

        <p className="mt-10 text-sm">
          <a href="/" className="text-muted underline-offset-4 hover:text-accent hover:underline">
            Back to the site
          </a>
        </p>
      </main>
    </div>
  )
}
