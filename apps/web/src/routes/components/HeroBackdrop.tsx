import { Media } from './Media'

/* Fractal-noise grain, inlined so it costs no request. Kills the banding that
   large blurred gradients produce on dark backgrounds and gives the flat
   colour a bit of photographic texture. */
const grain =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/**
 * Layered hero background. Everything here is CSS, so it stands on its own
 * before any photography exists; dropping `public/gym/hero.jpg` in adds a
 * photo layer on top without changing anything else.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {/* Optional photo. Hidden entirely if the file is missing, so the
          CSS layers below still stand on their own. Mostly desaturated — the
          source has a teal cast that fights the red accent — but not fully,
          so its own red highlights survive. */}
      <Media
        src="/gym/hero.jpg"
        alt=""
        hideOnError
        className="absolute inset-0 size-full object-cover opacity-70 grayscale-[0.85]"
      />
      {/* Scrim. On mobile the copy and the form stack vertically, so keep it
          even and let the photo read the whole way down. On desktop they sit
          side by side, so darken only the headline column. */}
      <div className="absolute inset-0 bg-background/68 lg:hidden" />
      <div className="absolute inset-0 hidden bg-linear-to-r from-background via-background/75 to-background/20 lg:block" />

      {/* Warm key light, upper right. */}
      <div className="absolute -top-[28rem] -right-40 size-[58rem] rounded-full bg-accent/22 blur-[130px]" />
      {/* Cooler fill, lower left, so the frame isn't lit from one side only. */}
      <div className="absolute -bottom-[24rem] -left-52 size-[46rem] rounded-full bg-accent/12 blur-[140px]" />

      {/* Angled slashes echoing the logo's X. */}
      <div className="absolute inset-0 opacity-70">
        <div className="absolute -top-32 right-[12%] h-[46rem] w-px rotate-[24deg] bg-linear-to-b from-transparent via-accent/45 to-transparent" />
        <div className="absolute -top-32 right-[18%] h-[46rem] w-[3px] rotate-[24deg] bg-linear-to-b from-transparent via-accent/20 to-transparent" />
        <div className="absolute -bottom-40 left-[8%] h-[40rem] w-px rotate-[24deg] bg-linear-to-t from-transparent via-foreground/15 to-transparent" />
      </div>

      {/* Fine diagonal hatch, barely there. */}
      <div className="absolute inset-0 opacity-[0.06] bg-[repeating-linear-gradient(114deg,transparent_0_26px,var(--color-foreground)_26px_27px)]" />

      {/* Grain. */}
      <div
        className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
        style={{ backgroundImage: grain }}
      />

      {/* Vignette. Centred rather than anchored near the top — anchoring it high
          crushes the lower half of a tall mobile hero, which is where the form
          sits. */}
      <div className="absolute inset-0 bg-[radial-gradient(145%_130%_at_50%_45%,transparent_48%,var(--color-background)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent to-background" />
    </div>
  )
}
