import { faqs, gym, plans, periodLabel, seo } from './content'

const site = `https://${gym.domain}`
const url = (path: string) => `${site}${path}`

/* Head tags and schema, built from content.ts rather than hand-written, so the
   address, hours and prices can't drift from what the page renders, and
   server-rendered into the HTML — a crawler shouldn't have to run JS for them.

   Only facts we can stand behind go in the schema. No aggregateRating (there
   are no real reviews), no amenityFeature (the equipment list is still
   placeholder), and questions with no answer yet are dropped from the FAQ. */
function schema() {
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

  return graph
}

export const siteHead = {
  meta: [
    { title: seo.title },
    { name: 'description', content: seo.description },

    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: `${site}/` },
    { property: 'og:site_name', content: `${gym.name} gym` },
    { property: 'og:title', content: seo.title },
    { property: 'og:description', content: seo.ogDescription },
    { property: 'og:image', content: url(seo.image.url) },
    { property: 'og:image:width', content: String(seo.image.width) },
    { property: 'og:image:height', content: String(seo.image.height) },
    { property: 'og:image:alt', content: seo.image.alt },
    { property: 'og:locale', content: 'en_IN' },

    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: seo.title },
    { name: 'twitter:description', content: seo.ogDescription },
    { name: 'twitter:image', content: url(seo.image.url) },
  ],
  links: [{ rel: 'canonical', href: `${site}/` }],
  scripts: [
    { type: 'application/ld+json', children: JSON.stringify(schema()) },
  ],
}
