import { Section } from '../components/Section'
import { CtaPair } from '../components/CtaPair'
import { FaDumbbell } from 'react-icons/fa'
import { MdFitnessCenter } from 'react-icons/md'
import { TbBarbell, TbJumpRope, TbStretching, TbTreadmill } from 'react-icons/tb'
import { equipment } from '../content'

/** One icon per equipment card, in the order they appear in content.ts. */
const icons = [
  FaDumbbell, // free weights
  TbBarbell, // power racks
  MdFitnessCenter, // machines
  TbTreadmill, // cardio
  TbJumpRope, // functional
  TbStretching, // recovery
]

export function Equipment() {
  return (
    <Section
      id="equipment"
      lead="The"
      accent="Floor"
      sub="Everything you need, enough of it that you're never waiting"
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {equipment.map((item, i) => (
          <article
            key={item.name}
            className="group rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/50 sm:p-6"
          >
            <div className="grid size-11 place-items-center rounded-lg bg-accent/12 text-accent">
              {(() => {
                const Icon = icons[i % icons.length]
                return <Icon className="size-6" aria-hidden="true" />
              })()}
            </div>
            <h3 className="display mt-4 text-base sm:text-lg">{item.name}</h3>
            <p className="mt-2 text-sm text-muted text-pretty">{item.description}</p>
          </article>
        ))}
      </div>

      <div className="mt-12 text-center">
        <CtaPair location="equipment" />
      </div>
    </Section>
  )
}
