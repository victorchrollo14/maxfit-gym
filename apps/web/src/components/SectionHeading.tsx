/**
 * The signature heading: heavy upright caps with the final word in red, over a
 * letterspaced subtitle and a short red rule.
 */
export function SectionHeading({
  lead,
  accent,
  sub,
}: {
  lead: string
  accent: string
  sub?: string
}) {
  return (
    <header className="text-center">
      <h2 className="display text-3xl sm:text-4xl md:text-5xl">
        {lead} <span className="display text-accent">{accent}</span>
      </h2>
      {sub && <p className="eyebrow mx-auto mt-4 max-w-lg text-muted">{sub}</p>}
      <div className="mx-auto mt-5 h-[3px] w-14 bg-accent" />
    </header>
  )
}

/** Left-aligned label with a red tick, used above sub-groups. */
export function BarLabel({ children }: { children: string }) {
  return (
    <p className="eyebrow flex items-center gap-3 text-foreground">
      <span className="h-4 w-[3px] shrink-0 bg-accent" />
      {children}
    </p>
  )
}
