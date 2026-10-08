import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Accordion } from '@heroui/react'
import {
  FaDumbbell,
  FaEnvelope,
  FaInstagram,
  FaPause,
  FaPhoneAlt,
  FaPlay,
  FaStar,
  FaVolumeMute,
  FaVolumeUp,
  FaWhatsapp,
} from 'react-icons/fa'
import { LuMenu, LuX } from 'react-icons/lu'
import { MdFitnessCenter } from 'react-icons/md'
import { TbBarbell, TbJumpRope, TbStretching, TbTreadmill } from 'react-icons/tb'

import { Cta } from '@/routes/components/Cta'
import { CtaPair } from './components/CtaPair'
import { HeroBackdrop } from '@/routes/components/HeroBackdrop'
import { Logo } from '@/routes/components/Logo'
import { MapEmbed } from '@/routes/components/MapEmbed'
import { Media } from '@/routes/components/Media'
import { Section } from './components/Section'
import { BarLabel } from './components/SectionHeading'
import { StickyCta } from './components/StickyCta'
import {
  equipment,
  faqs,
  gallery,
  gym,
  monthlyRate,
  periodLabel,
  periodMonths,
  plans,
  reviews,
  videos,
  type Plan,
} from '@/content'
import { ctaTracker, type CtaAction } from '@/lib/analytics'
import { formatINR, formatList } from '@/lib/format'
import { telHref, whatsappHref } from '@/lib/links'

const waHref = whatsappHref(
  `Hi ${gym.name}, I'd like to know more about membership.`,
)

export const Route = createFileRoute('/_public/_layout/(home)/')({
  component: Home,
})

export function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Pricing />
        <Equipment />
        <Videos />
        <Gallery />
        <Results />
        <CallBand />
        <Faq />
        <Visit />
      </main>
      <Footer />
      <StickyCta />
    </>
  )
}

/* Results renders nothing while there are no reviews, so the link to it has to
   go too — a nav item that scrolls nowhere is worse than one less item. */
const links = [
  { href: '#pricing', label: 'Plans' },
  { href: '#equipment', label: 'Equipment' },
  { href: '#inside', label: 'Inside' },
  ...(reviews.length > 0 ? [{ href: '#results', label: 'Results' }] : []),
  { href: '#visit', label: 'Location' },
]

function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  /* Fixed rather than sticky so it floats over the hero backdrop instead of
     stacking a solid band above it. `Hero` carries the matching top padding. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll() // a reload can restore a scrolled position
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* The menu is a full-screen sheet, so the page behind it must not scroll,
     and Escape has to close it. */
  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  /* Transparent over the hero, solid once the page moves under it. With the
     menu open it goes transparent again whatever the scroll position, so the
     bar sits on the sheet's own backdrop rather than a black band across it. */
  const solid = scrolled && !open

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${solid
          ? 'border-border bg-background/95 backdrop-blur'
          : 'border-transparent bg-transparent'
          }`}
      >
        <nav
          aria-label="Main"
          className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-2.5 sm:gap-4"
        >
          <a href="#top" aria-label={`${gym.name} home`} className="shrink-0">
            <Logo className="h-9 sm:h-11" />
          </a>

          <ul className="ml-auto hidden items-center gap-7 lg:flex">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="eyebrow text-muted transition-colors hover:text-accent"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop only — on mobile the floating bottom bar carries both CTAs. */}
          <div className="ml-8 hidden shrink-0 lg:block">
            <CtaPair location="nav" size="md" layout="row" />
          </div>

          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation"
            onClick={() => setOpen((v) => !v)}
            className="-mr-1.5 ml-auto grid size-12 shrink-0 place-items-center rounded-md text-foreground lg:hidden"
          >
            {open ? <LuX className="size-7" /> : <LuMenu className="size-7" />}
          </button>
        </nav>
      </header>

      {/* Outside the header on purpose: `backdrop-blur` there would make it a
          containing block for this `fixed` sheet, pinning it to the bar's
          height. z-45 clears the bottom StickyCta (z-40), whose two buttons the
          sheet repeats, and stays under the bar itself (z-50). */}
      {open && (
        <div
          id="mobile-nav"
          className="animate-sheet-in fixed inset-0 z-[45] overflow-y-auto bg-background motion-reduce:animate-none lg:hidden"
        >
          {/* Same furniture as the hero backdrop, cheap version: an accent glow
              and the angled slashes, so the sheet reads as part of the site
              rather than a plain drawer. */}
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-56 -right-24 size-[34rem] rounded-full bg-accent/22 blur-[120px]" />
            <div className="absolute -bottom-64 -left-32 size-[30rem] rounded-full bg-accent/10 blur-[130px]" />
            <div className="absolute -top-24 right-[14%] h-[42rem] w-px rotate-[24deg] bg-linear-to-b from-transparent via-accent/40 to-transparent" />
            <div className="absolute -top-24 right-[22%] h-[42rem] w-[3px] rotate-[24deg] bg-linear-to-b from-transparent via-accent/15 to-transparent" />
            <div className="absolute inset-0 opacity-[0.05] bg-[repeating-linear-gradient(114deg,transparent_0_26px,var(--color-foreground)_26px_27px)]" />
          </div>

          {/* min-h-full + flex-col so the CTAs sit at the bottom of the screen
              on a tall phone, but still scroll on a short one. */}
          <div className="relative flex min-h-full flex-col px-5 pt-24 pb-8">
            <ul>
              {links.map((l, i) => (
                <li
                  key={l.href}
                  className="animate-row-in border-b border-border/70 motion-reduce:animate-none"
                  style={{ animationDelay: `${60 + i * 55}ms` }}
                >
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="group flex items-baseline gap-4 py-4 active:text-accent"
                  >
                    <span className="eyebrow w-6 shrink-0 text-[0.6rem] text-accent/70">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="display text-3xl transition-colors group-active:text-accent">
                      {l.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <div
              className="animate-row-in mt-auto grid gap-3 pt-10 motion-reduce:animate-none"
              style={{ animationDelay: `${60 + links.length * 55}ms` }}
            >
              <CtaPair
                location="nav_sheet"
                layout="column"
                fill
                onNavigate={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const perks = [
  'Free fitness assessment',
  'Coaches on the floor',
  'Open from 6am, 7 days',
  'Lockers & showers',
  'Personal training',
  'No crowds at peak hour',
]

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <HeroBackdrop />

      {/* Top padding clears the fixed header (~68px mobile, ~66px desktop) on
          top of the hero's own spacing — the header no longer takes up flow. */}
      <div className="relative mx-auto max-w-6xl px-5 pt-28 pb-16 sm:pt-36 sm:pb-24">
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

          <div className="mt-8 flex">
            <CtaPair location="hero" />
          </div>

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

      </div>
    </section>
  )
}

/**
 * Savings vs paying the monthly rate for the same stretch of time — times the
 * number of people covered, or a couple plan reads as terrible value against a
 * single monthly membership.
 */
function savingsVsMonthly(plan: Plan) {
  const months = periodMonths[plan.period]
  const seats = plan.seats ?? 1
  if (months === 1 && seats === 1) return null
  const atMonthly = monthlyRate * months * seats
  const saved = atMonthly - plan.price
  if (saved <= 0) return null
  return { amount: saved, percent: Math.round((saved / atMonthly) * 100) }
}

/**
 * "3 MONTH PASS … ₹3,999 /3 months" stutters. The suffix only earns its place
 * on a plan whose name doesn't already state the term — the Festival Offer, say.
 */
function nameStatesTerm(plan: Plan) {
  return /month|annual|year/i.test(plan.name)
}

function PlanCard({ plan }: { plan: Plan }) {
  const track = ctaTracker('pricing_card')
  const savings = savingsVsMonthly(plan)

  return (
    <article
      className={`relative flex h-full flex-col rounded-2xl border p-6 sm:p-7 ${plan.featured
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
          onClick={() => track('whatsapp', { plan: plan.name })}
        >
          <FaWhatsapp className="size-4" aria-hidden="true" />
          Enquire now
        </Cta>
      </div>
    </article>
  )
}

function Pricing() {
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

/** One icon per equipment card, in the order they appear in content.ts. */
const icons = [
  FaDumbbell, // free weights
  TbBarbell, // power racks
  MdFitnessCenter, // machines
  TbTreadmill, // cardio
  TbJumpRope, // functional
  TbStretching, // recovery
]

function Equipment() {
  return (
    <Section
      id="equipment"
      lead="The"
      accent="Floor"
      sub="Everything you need, enough of it that you're never waiting"
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {equipment.map((item, i) => (
          <article
            key={item.name}
            className="group rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/50 sm:p-6"
          >
            <div className="grid size-11 place-items-center rounded-lg bg-accent/12 text-accent">
              {(() => {
                const Icon = icons[i % icons.length]
                return <Icon className="size-6" aria-hidden="true" />
              })()}
            </div>
            <h3 className="display mt-4 text-base sm:text-lg">{item.name}</h3>
            <p className="mt-2 text-sm text-muted text-pretty">{item.description}</p>
          </article>
        ))}
      </div>

      <div className="mt-12 text-center">
        <CtaPair location="equipment" />
      </div>
    </Section>
  )
}

function VideoCard({ video }: { video: (typeof videos)[number] }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)

  function toggle() {
    const el = ref.current
    if (!el) return
    if (el.paused) el.play()
    else el.pause()
  }

  return (
    /* 9:16 — these are phone-shot reels, so the frame matches the source. */
    <figure className="group relative aspect-9/16 w-72 shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-surface-secondary sm:w-80 lg:w-[22rem]">
      {failed ? (
        /* No video file yet — still show the poster so the section reads as
           designed, with the missing filename called out over it. */
        <>
          <Media
            src={video.poster}
            alt=""
            hideOnError
            className="absolute inset-0 size-full object-cover grayscale"
          />
          <div className="absolute inset-0 grid place-items-center bg-background/55 px-4 text-center">
            <p className="text-xs text-muted">
              Add <code>{video.src}</code> to public/
            </p>
          </div>
        </>
      ) : (
        <>
          {/* `src` goes on the element itself, not a <source> child — error
              events from <source> don't reach this handler. Native controls are
              off; the overlay button below drives playback. */}
          <video
            ref={ref}
            preload="metadata"
            playsInline
            muted={muted}
            src={video.src}
            poster={video.poster}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onError={() => setFailed(true)}
            className="absolute inset-0 size-full object-cover"
          />

          {/* Full-card hit area: one tap toggles on mobile, where there is no
              hover to reveal a control. */}
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? `Pause ${video.title}` : `Play ${video.title}`}
            className="absolute inset-0 grid place-items-center"
          >
            <span
              className={`grid size-16 place-items-center rounded-full bg-accent text-accent-foreground shadow-[0_8px_30px_-6px_var(--color-accent)] transition-opacity duration-200 ${playing
                ? 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
                : 'opacity-100'
                }`}
            >
              {playing ? (
                <FaPause className="size-5" />
              ) : (
                <FaPlay className="size-5 translate-x-0.5" />
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? `Unmute ${video.title}` : `Mute ${video.title}`}
            aria-pressed={!muted}
            className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-background/70 text-foreground backdrop-blur-sm"
          >
            {muted ? (
              <FaVolumeMute className="size-4" />
            ) : (
              <FaVolumeUp className="size-4" />
            )}
          </button>
        </>
      )}

      {/* Caption sits in the frame, over a scrim so it stays legible on any
          footage. pointer-events-none so it never blocks the tap-to-play. */}
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-background via-background/75 to-transparent p-4 pt-20">
        <span className="eyebrow inline-block rounded bg-accent px-2 py-1 text-accent-foreground">
          {video.tag}
        </span>
        <h3 className="display mt-2.5 text-xl">{video.title}</h3>
        <p className="eyebrow mt-1 text-accent">{video.caption}</p>
      </figcaption>
    </figure>
  )
}

function Videos() {
  if (videos.length === 0) return null

  return (
    <Section
      id="inside"
      lead="Inside"
      accent={gym.name}
      sub="See the training and the floor before you visit"
    >
      {/* Horizontal reel strip. Negative margin + padding lets cards bleed to
          the screen edge on mobile while staying aligned on desktop. */}
      <div className="-mx-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex snap-x snap-mandatory gap-4 lg:justify-center">
          {videos.map((v) => (
            <VideoCard key={v.src} video={v} />
          ))}
        </div>
      </div>
    </Section>
  )
}

function Gallery() {
  if (gallery.length === 0) return null

  return (
    <Section
      id="gallery"
      lead="The"
      accent="Gallery"
      sub="Plates, racks and the people who use them"
    >
      {/* Uniform 4:5 tiles in a plain grid. Multi-column masonry balanced by
          height and left the last column ragged; equal tiles with a count
          divisible by both column counts can't gap. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        {gallery.map((g) => (
          <figure
            key={g.src}
            className="group aspect-4/5 overflow-hidden rounded-xl border border-border"
          >
            <Media
              src={g.src}
              alt={g.alt}
              label="Gym photo"
              className="size-full object-cover grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
            />
          </figure>
        ))}
      </div>
    </Section>
  )
}

function Results() {
  // A new gym has none yet — emptying `reviews` in content.ts drops the
  // whole section rather than leaving an empty heading behind.
  if (reviews.length === 0) return null

  return (
    <Section
      id="results"
      lead="What members"
      accent="Say"
      sub="Straight from the people training here"
    >
      <div className="grid gap-4 md:grid-cols-3">
        {reviews.map((r, i) => (
          <blockquote key={i} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex gap-0.5 text-accent" aria-label={`${r.rating} out of 5`}>
              {Array.from({ length: r.rating }, (_, s) => (
                <FaStar key={s} className="size-4" />
              ))}
            </div>
            <p className="mt-3 text-sm text-muted text-pretty">"{r.text}"</p>
            <footer className="mt-4">
              <p className="display text-sm">{r.name}</p>
              <p className="eyebrow mt-1 text-muted">{r.plan}</p>
            </footer>
          </blockquote>
        ))}
      </div>
    </Section>
  )
}

/**
 * Full-bleed red band. Sits where the reference put its ratings strip — a new
 * gym has no numbers to boast yet, so it carries a call to action instead.
 *
 * Keeps its own buttons rather than `CtaPair`: on the accent background the
 * site's normal solid/outline tones have nothing to sit against.
 */
function CallBand() {
  const track = ctaTracker('call_band')

  return (
    <section className="bg-accent px-5 py-10 text-accent-foreground sm:py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-7 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="display text-2xl sm:text-4xl">
            Come see the place before you commit
          </p>
          <p className="eyebrow mt-2.5 opacity-85">
            Call us and we'll show you around — no pressure, no sales pitch
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
          <a
            href={telHref}
            onClick={() => track('call')}
            /* Same look the WhatsApp button takes on hover: white fill, red
               label. border-2 matches that button's height exactly. */
            className="display inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-accent-foreground bg-accent-foreground px-7 py-4 text-sm text-accent transition hover:brightness-90"
          >
            <FaPhoneAlt className="size-4" />
            Call now
          </a>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('whatsapp')}
            className="display inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-accent-foreground/70 px-7 py-4 text-sm text-accent-foreground transition hover:bg-accent-foreground hover:text-accent"
          >
            <FaWhatsapp className="size-5" />
            Chat now
          </a>
        </div>
      </div>
    </section>
  )
}

function Faq() {
  // Unanswered entries are placeholders in content.ts — don't ship a blank answer.
  const answered = faqs.filter((f) => f.a.trim() !== '')

  return (
    <Section id="faq" lead="Common" accent="Questions" sub="The things people message us about">
      <Accordion className="mx-auto max-w-3xl">
        {answered.map((f) => (
          <Accordion.Item key={f.q} id={f.q}>
            <Accordion.Heading>
              <Accordion.Trigger className="py-5 text-left text-lg font-semibold sm:text-xl">
                {f.q}
                <Accordion.Indicator className="size-6" />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body>
                <p className="pb-5 text-base text-muted text-pretty sm:text-lg">{f.a}</p>
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Section>
  )
}

function Visit() {
  return (
    <Section
      id="visit"
      lead="Our"
      accent="Location"
      sub="Walk in during opening hours — no appointment needed"
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <BarLabel>Where we are</BarLabel>
          {/* The street line carries the display treatment; the locality line
              stays body text — the full postal address is long enough that two
              display lines swamp the column. */}
          <address className="mt-4 not-italic">
            <p className="display text-lg text-pretty sm:text-xl">
              {gym.address.line1}
            </p>
            <p className="mt-1.5 text-sm text-muted text-pretty">
              {gym.address.line2}
            </p>
          </address>

          <div className="mt-10">
            <BarLabel>Nearby</BarLabel>
            {/* Named in full because a "gym near <locality>" search has nothing
                to match unless the page says the locality out loud. */}
            <p className="mt-4 text-sm text-muted text-pretty">
              We're on Kithaganur Main Road, right by {gym.landmark} — a short
              ride from {formatList(gym.nearby)}.
            </p>
          </div>

          <div className="mt-10">
            <BarLabel>Opening hours</BarLabel>
            <dl className="mt-4 divide-y divide-border border-y border-border">
              {gym.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-4 py-3">
                  <dt className="text-sm text-muted">{h.days}</dt>
                  <dd className="eyebrow">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <MapEmbed className="h-80 w-full sm:h-96 lg:aspect-square lg:h-auto" />
      </div>
    </Section>
  )
}

const socials: {
  label: string
  href: string
  Icon: typeof FaPhoneAlt
  external: boolean
  action: CtaAction
}[] = [
    {
      label: `Call ${gym.phone}`,
      href: telHref,
      Icon: FaPhoneAlt,
      external: false,
      action: 'call',
    },
    {
      label: 'Chat on WhatsApp',
      href: waHref,
      Icon: FaWhatsapp,
      external: true,
      action: 'whatsapp',
    },
    {
      label: `${gym.name} on Instagram`,
      href: `https://instagram.com/${gym.instagram}`,
      Icon: FaInstagram,
      external: true,
      action: 'instagram',
    },
    {
      label: `Email ${gym.email}`,
      href: `mailto:${gym.email}`,
      Icon: FaEnvelope,
      external: false,
      action: 'email',
    },
  ]

const columns = [
  {
    heading: 'Explore',
    links: [
      { href: '#pricing', label: 'Plans' },
      { href: '#equipment', label: 'Equipment' },
      { href: '#inside', label: 'Inside' },
      { href: '#gallery', label: 'Gallery' },
    ],
  },
  {
    heading: 'Visit',
    links: [
      { href: '#visit', label: 'Location' },
      { href: '#visit', label: 'Opening hours' },
      { href: '#faq', label: 'FAQ' },
    ],
  },
]

function Footer() {
  const track = ctaTracker('footer_socials')

  return (
    <footer>
      {/* The closing CTA stays a contained card. */}
      <div className="px-4 sm:px-5">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-border bg-surface px-6 py-14 text-center sm:px-10 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="display text-3xl sm:text-4xl md:text-5xl">
              Ready to start your{' '}
              <span className="text-accent">transformation?</span>
            </h2>
            <p className="mt-5 text-muted text-pretty">
              Call us or message on WhatsApp and we'll show you around.{' '}
              The festival offer won't last.
            </p>
            <div className="mt-8">
              <CtaPair location="footer" size="xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Links flow straight on the page — no card, no divider rules. */}
      <div className="mx-auto max-w-6xl px-5 pt-16 pb-10 sm:pt-20">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
          <div>
            <Logo variant="full" className="h-24" />

            {/* Tagline gets the display treatment — same three beats as the
                hero headline, so the page closes on the line it opened with. */}
            <p className="display mt-6 text-2xl leading-[1.05] sm:text-3xl">
              {gym.hero.boxed}
              <br />
              {gym.hero.rest}
              <br />
              <span className="text-outline">{gym.hero.outline}</span>
            </p>

            <ul className="mt-7 flex gap-3">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    aria-label={s.label}
                    onClick={() => track(s.action)}
                    {...(s.external
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                    className="grid size-10 place-items-center rounded-full border border-border text-muted transition-colors hover:border-accent/60 hover:text-accent"
                  >
                    <s.Icon className="size-4.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {columns.map((col) => (
            <nav key={col.heading}>
              <p className="eyebrow text-foreground">{col.heading}</p>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-muted transition-colors hover:text-accent"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <p className="eyebrow text-foreground">Contact</p>
            <address className="mt-5 space-y-3 text-sm not-italic text-muted">
              <p className="text-pretty">
                {gym.address.line1}
                <br />
                {gym.address.line2}
              </p>
              <p>
                <a
                  href={telHref}
                  onClick={() => track('call')}
                  className="transition-colors hover:text-accent"
                >
                  {gym.phone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${gym.email}`}
                  onClick={() => track('email')}
                  className="transition-colors hover:text-accent"
                >
                  {gym.email}
                </a>
              </p>
              <p>
                <a
                  href={`https://instagram.com/${gym.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('instagram')}
                  className="transition-colors hover:text-accent"
                >
                  @{gym.instagram}
                </a>
              </p>
            </address>
          </div>
        </div>

        <p className="mt-16 text-xs text-muted">
          © {new Date().getFullYear()} {gym.name} Gym. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
