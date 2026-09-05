import { Section } from '../components/Section'
import { Media } from '../components/Media'
import { gallery } from '../content'

export function Gallery() {
  if (gallery.length === 0) return null

  return (
    <Section
      id="gallery"
      lead="The"
      accent="Gallery"
      sub="Plates, racks and the people who use them"
    >
      {/* Uniform 4:5 tiles in a plain grid. Multi-column masonry balanced by
          height and left the last column ragged; equal tiles with a count
          divisible by both column counts can't gap. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        {gallery.map((g) => (
          <figure
            key={g.src}
            className="group aspect-4/5 overflow-hidden rounded-xl border border-border"
          >
            <Media
              src={g.src}
              alt={g.alt}
              label="Gym photo"
              className="size-full object-cover grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
            />
          </figure>
        ))}
      </div>
    </Section>
  )
}
