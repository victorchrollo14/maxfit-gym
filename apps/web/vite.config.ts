import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { faqs, gym, plans, periodLabel, seo } from './src/content.ts'

const site = `https://${gym.domain}`
const url = (path: string) => `${site}${path}`

/* Head tags and schema, built from content.ts rather than hand-written in
   index.html, so the address, hours and prices can't drift from what the page
   renders, and injected into the served HTML rather than by React — a crawler
   shouldn't have to run JS for them.

   Only facts we can stand behind go in the schema. No aggregateRating (there
   are no real reviews), no amenityFeature (the equipment list is still
   placeholder), and questions with no answer yet are dropped from the FAQ. */
function head(): Plugin {
  const answered = faqs.filter((f) => f.a)

  const heroImage = {
    '@type': 'ImageObject',
    '@id': url('/#hero'),
    url: url(seo.image.url),
    contentUrl: url(seo.image.url),
    width: seo.image.width,
    height: seo.image.height,
    caption: seo.image.alt,
  }

  const logo = {
    '@type': 'ImageObject',
    '@id': url('/#logo'),
    url: url(seo.logo.url),
    contentUrl: url(seo.logo.url),
    width: seo.logo.width,
    height: seo.logo.height,
    caption: `${gym.name} gym logo`,
  }

  /* Both types, not just HealthClub: ExerciseGym is what "gym" resolves to. */
  const business = {
    '@type': ['HealthClub', 'ExerciseGym'],
    '@id': url('/#gym'),
    name: `${gym.name} gym`,
    alternateName: `${gym.name.toUpperCase()} Gym ${gym.city}`,
    description: gym.intro,
    slogan: gym.tagline,
    url: `${site}/`,
    image: { '@id': heroImage['@id'] },
    logo: { '@id': logo['@id'] },
    telephone: `+${gym.whatsapp}`,
    email: gym.email,
    foundingDate: String(gym.foundedYear),
    isAccessibleForFree: false,
    publicAccess: true,
    priceRange: `₹${Math.min(...plans.map((p) => p.price))}-₹${Math.max(
      ...plans.map((p) => p.price),
    )}`,
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, UPI',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Membership enquiries',
      telephone: `+${gym.whatsapp}`,
      email: gym.email,
      url: `${site}/#enquiry`,
    },
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
      { '@type': 'City', name: gym.city },
      ...gym.nearby.map((name) => ({ '@type': 'Place', name })),
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
        category: 'Gym membership',
        availability: 'https://schema.org/InStock',
        url: `${site}/#pricing`,
        seller: { '@id': url('/#gym') },
        itemOffered: {
          '@type': 'Service',
          name: plan.name,
          serviceType: 'Gym membership',
          description: `${plan.name} — full gym access for one ${periodLabel[plan.period]}.`,
          areaServed: { '@type': 'City', name: gym.city },
          provider: { '@id': url('/#gym') },
        },
      })),
    },
    sameAs: [`https://www.instagram.com/${gym.instagram}/`],
  }

  const website = {
    '@type': 'WebSite',
    '@id': url('/#website'),
    url: `${site}/`,
    name: `${gym.name} gym`,
    description: seo.description,
    publisher: { '@id': url('/#gym') },
    inLanguage: 'en-IN',
  }

  const webpage = {
    '@type': 'WebPage',
    '@id': url('/#webpage'),
    url: `${site}/`,
    name: seo.title,
    description: seo.description,
    isPartOf: { '@id': url('/#website') },
    about: { '@id': url('/#gym') },
    primaryImageOfPage: { '@id': heroImage['@id'] },
    inLanguage: 'en-IN',
  }

  const faqPage = {
    '@type': 'FAQPage',
    '@id': url('/#faq'),
    isPartOf: { '@id': url('/#webpage') },
    mainEntity: answered.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      business,
      website,
      webpage,
      heroImage,
      logo,
      ...(answered.length ? [faqPage] : []),
    ],
  }

  const meta = (attr: 'name' | 'property', key: string, content: string) => ({
    tag: 'meta',
    attrs: { [attr]: key, content },
    injectTo: 'head' as const,
  })

  return {
    name: 'maxfit-head',
    transformIndexHtml: () => [
      { tag: 'title', children: seo.title, injectTo: 'head' as const },
      meta('name', 'description', seo.description),

      meta('property', 'og:type', 'website'),
      meta('property', 'og:url', `${site}/`),
      meta('property', 'og:site_name', `${gym.name} gym`),
      meta('property', 'og:title', seo.title),
      meta('property', 'og:description', seo.ogDescription),
      meta('property', 'og:image', url(seo.image.url)),
      meta('property', 'og:image:width', String(seo.image.width)),
      meta('property', 'og:image:height', String(seo.image.height)),
      meta('property', 'og:image:alt', seo.image.alt),
      meta('property', 'og:locale', 'en_IN'),

      meta('name', 'twitter:card', 'summary_large_image'),
      meta('name', 'twitter:title', seo.title),
      meta('name', 'twitter:description', seo.ogDescription),
      meta('name', 'twitter:image', url(seo.image.url)),

      {
        tag: 'script',
        attrs: { type: 'application/ld+json' },
        children: JSON.stringify(graph),
        injectTo: 'head' as const,
      },
    ],
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), head()],
})
