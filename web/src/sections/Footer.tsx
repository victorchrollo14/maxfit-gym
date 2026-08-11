import { FaEnvelope, FaInstagram, FaPhoneAlt, FaWhatsapp } from 'react-icons/fa'
import { Cta } from '../components/Cta'
import { Logo } from '../components/Logo'
import { earlyBird, gym } from '../content'

const telHref = `tel:${gym.phone.replace(/\s/g, '')}`
const waHref = `https://wa.me/${gym.whatsapp}?text=${encodeURIComponent(
  `Hi ${gym.name}, I'd like to know more about membership.`,
)}`

const socials = [
  { label: `Call ${gym.phone}`, href: telHref, Icon: FaPhoneAlt, external: false },
  { label: 'Chat on WhatsApp', href: waHref, Icon: FaWhatsapp, external: true },
  {
    label: `${gym.name} on Instagram`,
    href: `https://instagram.com/${gym.instagram}`,
    Icon: FaInstagram,
    external: true,
  },
  {
    label: `Email ${gym.email}`,
    href: `mailto:${gym.email}`,
    Icon: FaEnvelope,
    external: false,
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
      { href: '#visit', label: 'Find us' },
      { href: '#visit', label: 'Opening hours' },
      { href: '#faq', label: 'FAQ' },
      { href: '#enquiry', label: 'Free trial' },
    ],
  },
]

export function Footer() {
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
              <span className="ml-[0.12em] text-accent">transformation?</span>
            </h2>
            <p className="mt-5 text-muted text-pretty">
              Book a free trial session and see the place for yourself.{' '}
              {earlyBird.seatsLeft} early bird passes are still open.
            </p>
            <div className="mt-8 flex justify-center">
              <Cta href="#enquiry" size="xl">
                Claim free trial
              </Cta>
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
                <a href={telHref} className="transition-colors hover:text-accent">
                  {gym.phone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${gym.email}`}
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
