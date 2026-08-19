import { MapEmbed } from '../components/MapEmbed'
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
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
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

        <MapEmbed className="h-80 w-full sm:h-96 lg:aspect-square lg:h-auto" />
      </div>
    </Section>
  )
}
