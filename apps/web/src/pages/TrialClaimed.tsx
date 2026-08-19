import { useEffect } from 'react'
import { FaPhoneAlt, FaWhatsapp } from 'react-icons/fa'
import { LuCheck, LuClock, LuMapPin } from 'react-icons/lu'
import { CopyButton } from '../components/CopyButton'
import { Cta } from '../components/Cta'
import { HeroBackdrop } from '../components/HeroBackdrop'
import { Logo } from '../components/Logo'
import { MapEmbed } from '../components/MapEmbed'
import { fullAddress, gym } from '../content'
import { telHref, whatsappHref } from '../lib/links'
import { takeConversionToken } from '../lib/trialClaim'

const waHref = whatsappHref(
  `Hi ${gym.name}, I just claimed the free trial on your website.`,
)

export function TrialClaimed() {
  /* No head manager in the app, and this is the only route that needs to differ
     from index.html. */
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

  /* Once per claim, not once per view. TODO (V1 §7): send to PostHog. */
  useEffect(() => {
    if (!takeConversionToken()) return
    console.info('conversion: free trial claimed')
  }, [])

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      <HeroBackdrop />

      <main className="relative mx-auto w-full max-w-2xl px-5 py-16 sm:py-20">
        <div className="text-center">
          <a href="/" aria-label={`${gym.name} home`} className="inline-block">
            <Logo className="h-10 sm:h-12" />
          </a>

          <div className="mx-auto mt-12 grid size-16 place-items-center rounded-full bg-accent text-accent-foreground shadow-[0_8px_40px_-8px_var(--color-accent)]">
            <LuCheck className="size-8" aria-hidden="true" strokeWidth={3} />
          </div>

          <h1 className="display mt-8 text-4xl sm:text-5xl md:text-6xl">
            Free trial <span className="display text-accent">claimed.</span>
          </h1>

          <p className="mx-auto mt-2.5 max-w-md text-sm text-pretty text-muted">
            You can visit the gym anytime for your trial.
          </p>
        </div>

        <div className="mt-10">
          <MapEmbed className="h-80 w-full sm:h-96 md:aspect-square md:h-auto" />
        </div>

        <address className="mt-8 not-italic">
          <p className="eyebrow flex items-center gap-2.5 text-muted">
            <LuMapPin className="size-3.5 text-accent" aria-hidden="true" />
            Where we are
          </p>
          <p className="display mt-4 text-lg text-pretty sm:text-xl">
            {gym.address.line1}
          </p>
          <p className="mt-1.5 text-sm text-pretty text-muted">
            {gym.address.line2}
          </p>
        </address>

        <div className="mt-5">
          <CopyButton
            value={fullAddress}
            label="Copy address"
            copiedLabel="Copied"
          />
        </div>

        <div className="mt-12 rounded-xl border border-border bg-surface p-5">
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

        <div className="mx-auto mt-10 grid max-w-lg gap-3 sm:grid-cols-2">
          <Cta href={telHref} size="lg" className="w-full">
            <FaPhoneAlt className="size-4" aria-hidden="true" />
            Call now
          </Cta>
          <Cta href={waHref} size="lg" tone="white" className="w-full" external>
            <FaWhatsapp className="size-5" aria-hidden="true" />
            Chat on WhatsApp
          </Cta>
        </div>

        <p className="mt-10 text-center text-sm">
          <a
            href="/"
            className="text-muted underline-offset-4 hover:text-accent hover:underline"
          >
            Back to the site
          </a>
        </p>
      </main>
    </div>
  )
}
