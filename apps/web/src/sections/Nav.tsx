import { useEffect, useState } from 'react'
import { CtaPair } from '../components/CtaPair'
import { Logo } from '../components/Logo'
import { LuMenu, LuX } from 'react-icons/lu'
import { gym, reviews } from '../content'

/* Results renders nothing while there are no reviews, so the link to it has to
   go too — a nav item that scrolls nowhere is worse than one less item. */
const links = [
  { href: '#pricing', label: 'Plans' },
  { href: '#equipment', label: 'Equipment' },
  { href: '#inside', label: 'Inside' },
  ...(reviews.length > 0 ? [{ href: '#results', label: 'Results' }] : []),
  { href: '#visit', label: 'Location' },
]

export function Nav() {
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
        className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
          solid
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
