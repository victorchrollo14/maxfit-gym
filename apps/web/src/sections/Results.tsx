import { Section } from '../components/Section'
import { CtaPair } from '../components/CtaPair'
import { FaStar } from 'react-icons/fa'
import { reviews } from '../content'

export function Results() {
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

      <div className="mt-12 text-center">
        <CtaPair location="results" />
      </div>
    </Section>
  )
}
