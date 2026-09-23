import { useEffect } from 'react'
import { createFileRoute, Navigate } from '@tanstack/react-router'
import { FaPhoneAlt, FaWhatsapp } from 'react-icons/fa'
import { LuCheck, LuClock, LuMapPin } from 'react-icons/lu'

import { CopyButton } from './components/CopyButton'
import { Cta } from '../../../components/Cta'
import { HeroBackdrop } from '../../../components/HeroBackdrop'
import { Logo } from '../../../components/Logo'
import { MapEmbed } from '../../../components/MapEmbed'
import { fullAddress, gym } from '../../../../content'
import { capture, ctaTracker } from '../../../../lib/analytics'
import { telHref, whatsappHref } from '../../../../lib/links'
import { hasTrialClaim, takeConversionToken } from '../../../../lib/trialClaim'

const waHref = whatsappHref(
  `Hi ${gym.name}, I just claimed the free trial on your website.`,
)

/* Gated so Google Ads can't count a bookmark or a shared link as a second
   lead — see lib/trialClaim.ts. The claim is in sessionStorage, which only the
   browser can read, so the page isn't server-rendered. The redirect lives in
   the component rather than beforeLoad: a beforeLoad redirect during hydration
   is a hydration error. */
export const Route = createFileRoute('/_public/_layout/trial-claimed/')({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Free trial claimed — ${gym.name} Gym` },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: TrialClaimedGate,
})

function TrialClaimedGate() {
  if (!hasTrialClaim()) return <Navigate to="/" replace />
  return <TrialClaimed />
}

function TrialClaimed() {
  const track = ctaTracker('trial_claimed')

  /* Once per claim, not once per view — a reload or a shared link must not
     count a second conversion. */
  useEffect(() => {
    if (!takeConversionToken()) return
    capture('trial_conversion')
  }, [])

  return (
    <div className="relative min-h-dvh overflow-hidden">
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
          <Cta
            href={telHref}
            size="lg"
            className="w-full"
            onClick={() => track('call')}
          >
            <FaPhoneAlt className="size-4" aria-hidden="true" />
            Call now
          </Cta>
          <Cta
            href={waHref}
            size="lg"
            tone="white"
            className="w-full"
            external
            onClick={() => track('whatsapp')}
          >
            <FaWhatsapp className="size-5" aria-hidden="true" />
            Chat now
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
