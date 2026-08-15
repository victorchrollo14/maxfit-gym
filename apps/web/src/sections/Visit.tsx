import { LuExternalLink } from 'react-icons/lu'
import { Section } from '../components/Section'
import { BarLabel } from '../components/SectionHeading'
import { gym } from '../content'

export function Visit() {
  return (
    <Section
      id="visit"
      lead="Our"
      accent="Location"
      sub="Walk in during opening hours — no appointment needed"
    >
      <div className="grid gap-10 lg:grid-cols-2">
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

        <div className="relative overflow-hidden rounded-xl border border-border">
          {gym.mapEmbedUrl ? (
            <>
              <iframe
                src={gym.mapEmbedUrl}
                title={`Map to ${gym.name}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-80 w-full border-0 lg:h-full"
              />
              {/* Google's own "Open in Maps" chip is inside the iframe, so no
                  CSS of ours can reach it — this is a replacement sitting on
                  top, which is why it has to be at least as wide as the ~120px
                  chip it hides. Same corner, same label, our colours. */}
              {/* Geometry is not free choice: Google's chip sits 8px in from
                  the map's top-left and measures ~129x32 (plus a small tab
                  under it on mobile). Match that origin exactly and stay
                  larger, or its white edge shows around ours. */}
              <a
                href={gym.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="eyebrow absolute top-2 left-2 flex items-center gap-2 rounded-md bg-white py-3 pr-3 pl-3.5 text-accent shadow-lg transition-colors hover:bg-white/90"
              >
                {/* `eyebrow` tracks at 0.2em, which leaves a trailing space
                    after the final S and pushes the icon off-centre. */}
                <span className="-mr-[0.2em]">Open in Maps</span>
                <LuExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            </>
          ) : (
            <div className="grid h-80 place-items-center bg-surface px-6 text-center lg:h-full">
              <p className="max-w-xs text-sm text-pretty text-muted">
                Add a Google Maps embed URL to{' '}
                <code className="text-foreground">gym.mapEmbedUrl</code> in content.ts
              </p>
            </div>
          )}
        </div>
      </div>
    </Section>
  )
}
