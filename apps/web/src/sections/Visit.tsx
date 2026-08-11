import { Section } from '../components/Section'
import { BarLabel } from '../components/SectionHeading'
import { gym } from '../content'

export function Visit() {
  return (
    <Section
      id="visit"
      lead="Find"
      accent="Us"
      sub="Walk in during opening hours — no appointment needed"
    >
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <BarLabel>Where we are</BarLabel>
          <address className="mt-4 not-italic">
            <p className="display text-xl">{gym.address.line1}</p>
            <p className="display text-xl">{gym.address.line2}</p>
            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <a href={`tel:${gym.phone.replace(/\s/g, '')}`} className="hover:text-accent">
                {gym.phone}
              </a>
              <a href={`mailto:${gym.email}`} className="hover:text-accent">
                {gym.email}
              </a>
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

        <div className="overflow-hidden rounded-xl border border-border">
          {gym.mapEmbedUrl ? (
            <iframe
              src={gym.mapEmbedUrl}
              title={`Map to ${gym.name}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-80 w-full border-0 lg:h-full"
            />
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
