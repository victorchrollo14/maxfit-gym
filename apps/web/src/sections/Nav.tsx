import { useState } from 'react'
import { Cta } from '../components/Cta'
import { Logo } from '../components/Logo'
import { FaPhoneAlt } from 'react-icons/fa'
import { LuMenu, LuX } from 'react-icons/lu'
import { gym } from '../content'

const links = [
  { href: '#pricing', label: 'Plans' },
  { href: '#equipment', label: 'Equipment' },
  { href: '#inside', label: 'Inside' },
  { href: '#results', label: 'Results' },
  { href: '#visit', label: 'Find us' },
]

const telHref = `tel:${gym.phone.replace(/\s/g, '')}`

export function Nav() {
  const [open, setOpen] = useState(false)

  return (
    /* Solid and sticky, deliberately. A transparent header over the hero photo
       shows the photo through the logo's black field — `mix-blend-lighten`
       needs an opaque dark surface behind it. */
    <header className="sticky top-0 z-50 border-b border-border bg-background">
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
        <a
          href={telHref}
          className="eyebrow ml-8 hidden shrink-0 items-center gap-2 rounded-full border border-accent/50 px-4 py-2.5 text-accent transition-colors hover:bg-accent/10 lg:flex"
        >
          <FaPhoneAlt className="size-3.5" />
          Call now
        </a>

        <div className="hidden shrink-0 lg:block">
          <Cta href="#enquiry" size="md">
            Free trial
          </Cta>
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

      {open && (
        <ul
          id="mobile-nav"
          className="border-t border-border bg-background px-5 py-2 lg:hidden"
        >
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="eyebrow block py-3 text-muted"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  )
}
