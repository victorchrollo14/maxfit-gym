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
    /* Pinned: godmode's theme switch writes light/dark to <html>, and the
       landing page's art direction — the hero glows, the outlined display type
       — only reads on near black. Nothing here renders through a portal, so
       pinning the shell is enough to hold the whole page. */
    <div data-theme="dark" className="min-h-dvh bg-background text-foreground">
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
