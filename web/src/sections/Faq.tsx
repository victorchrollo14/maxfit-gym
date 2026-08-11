import { Accordion } from '@heroui/react'
import { Section } from '../components/Section'
import { faqs } from '../content'

export function Faq() {
  // Unanswered entries are placeholders in content.ts — don't ship a blank answer.
  const answered = faqs.filter((f) => f.a.trim() !== '')

  return (
    <Section id="faq" lead="Common" accent="Questions" sub="The things people message us about">
      <Accordion className="mx-auto max-w-3xl">
        {answered.map((f) => (
          <Accordion.Item key={f.q} id={f.q}>
            <Accordion.Heading>
              <Accordion.Trigger className="py-5 text-left text-lg font-semibold sm:text-xl">
                {f.q}
                <Accordion.Indicator className="size-6" />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body>
                <p className="pb-5 text-base text-muted text-pretty sm:text-lg">{f.a}</p>
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Section>
  )
}
