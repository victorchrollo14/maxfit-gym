import { Nav } from '../sections/Nav'
import { Hero } from '../sections/Hero'
import { Pricing } from '../sections/Pricing'
import { Equipment } from '../sections/Equipment'
import { Videos } from '../sections/Videos'
import { Gallery } from '../sections/Gallery'
import { Results } from '../sections/Results'
import { CallBand } from '../sections/CallBand'
import { Faq } from '../sections/Faq'
import { Visit } from '../sections/Visit'
import { Footer } from '../sections/Footer'
import { StickyCta } from '../components/StickyCta'

export function Landing() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <Pricing />
        <Equipment />
        <Videos />
        <Gallery />
        <Results />
        <CallBand />
        <Faq />
        <Visit />
      </main>
      <Footer />
      <StickyCta />
    </div>
  )
}
