import type { ReactNode } from 'react'
import { SectionHeading } from './SectionHeading'

export function Section({
  id,
  lead,
  accent,
  sub,
  children,
  className = '',
}: {
  id: string
  lead: string
  accent: string
  sub?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} className={`scroll-mt-20 px-5 py-16 sm:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl">
        <SectionHeading lead={lead} accent={accent} sub={sub} />
        <div className="mt-10 sm:mt-14">{children}</div>
      </div>
    </section>
  )
}
