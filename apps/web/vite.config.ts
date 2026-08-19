import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { gym, plans, periodLabel } from './src/content.ts'

const site = `https://${gym.domain}`

/* Built from content.ts rather than hand-written in index.html, so the address,
   hours and prices can't drift from what the page renders, and injected into the
   served HTML rather than by React — a crawler shouldn't have to run JS for it.

   Only facts we can stand behind go in. No aggregateRating (there are no real
   reviews), no amenityFeature (the equipment list is still placeholder), no
   FAQPage (two answers are empty and several are unconfirmed). */
function structuredData(): Plugin {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'HealthClub',
    '@id': `${site}/#gym`,
    name: `${gym.name} gym`,
    description: gym.intro,
    slogan: gym.tagline,
    url: `${site}/`,
    image: `${site}/gym/hero.jpg`,
    logo: `${site}/logo.png`,
    telephone: `+${gym.whatsapp}`,
    email: gym.email,
    priceRange: `₹${Math.min(...plans.map((p) => p.price))}-₹${Math.max(
      ...plans.map((p) => p.price),
    )}`,
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, UPI',
    address: {
      '@type': 'PostalAddress',
      streetAddress: gym.address.line1,
      addressLocality: 'Krishnarajapuram, Bengaluru',
      addressRegion: 'Karnataka',
      postalCode: '560036',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: gym.coords.lat,
      longitude: gym.coords.lng,
    },
    areaServed: [
      { '@type': 'City', name: 'Bengaluru' },
      { '@type': 'Place', name: 'Krishnarajapuram' },
      { '@type': 'Place', name: 'Kithiganur' },
    ],
    hasMap: gym.mapsUrl,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: gym.hoursSpec.opens,
        closes: gym.hoursSpec.closes,
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Gym memberships',
      itemListElement: plans.map((plan) => ({
        '@type': 'Offer',
        name: plan.name,
        description: plan.tagline,
        price: plan.price,
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: `${site}/#pricing`,
        itemOffered: {
          '@type': 'Service',
          name: plan.name,
          serviceType: 'Gym membership',
          description: `${plan.name} — full gym access for one ${periodLabel[plan.period]}.`,
          provider: { '@id': `${site}/#gym` },
        },
      })),
    },
    sameAs: [`https://www.instagram.com/${gym.instagram}/`],
  }

  return {
    name: 'maxfit-structured-data',
    transformIndexHtml: () => [
      {
        tag: 'script',
        attrs: { type: 'application/ld+json' },
        children: JSON.stringify(data),
        injectTo: 'head' as const,
      },
    ],
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), structuredData()],
})
