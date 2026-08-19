/**
 * Single source of truth for everything on the landing page.
 *
 * Anything marked TODO is a placeholder — swap the value, no component
 * changes needed. Images/videos live in `public/`; see public/README.md.
 */

/* Pulled out of `gym` so the embed URL and the structured data can share them —
   a self-referencing object literal can't. */
const coords = { lat: 13.0287704, lng: 77.7079326 }

export const gym = {
  name: 'maxfit',
  tagline: 'Train hard. Get strong. Stay consistent.',
  intro:
    'A serious strength and conditioning gym built for people who actually show up. Proper equipment, coaches who correct your form, and no crowds at peak hour.',
  /* Hero headline, split so the boxed / outlined treatment stays editable.
     Deliberately about the gym — pricing is the Plans section's job. */
  hero: {
    boxed: 'Train hard.',
    rest: 'Get strong.',
    outline: 'Stay consistent.',
  },
  phone: '+91 831 089 0652',
  whatsapp: '918310890652', // digits only, country code first
  domain: 'maxfitbangalore.in',
  city: 'Bengaluru',
  email: 'hello@maxfitbangalore.in', // TODO — set this mailbox up before launch
  instagram: 'max_fit_.gym_', // without the @
  address: {
    line1: "Site No A, Kithaganur Main Rd, near Domino's Pizza",
    line2: 'Kithiganur, Krishnarajapuram, Bengaluru, Karnataka 560036',
  },
  /* Keyless fallback, used only when VITE_GOOGLE_MAPS_EMBED_KEY is unset. The
     marker form `q=<lat>,<lng>` is not interchangeable with `q=<place name>`:
     the name form renders an info card but draws no pin, so this one is
     coordinates. Neither draws the gym's label — only the keyed Embed API
     does. See MapEmbed.tsx. */
  coords,
  mapEmbedUrl: `https://www.google.com/maps?q=${coords.lat},${coords.lng}+(maxfit+gym)&z=18&output=embed`,
  /* Query for the keyed Embed API. Name, not coordinates — that is what makes
     Google label the pin. */
  mapsQuery:
    'MAXFIT GYM, Kithaganur Main Rd, Krishnarajapuram, Bengaluru, Karnataka 560036',
  /* Where the map's "Open in Maps" button goes — same place, full app. */
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=MAXFIT+GYM,+Kithaganur+Main+Rd,+Krishnarajapuram,+Bengaluru,+Karnataka+560036',
  /* Same hours every day, so this is one row — the components map over it. */
  hours: [{ days: 'Every day', time: '6:00 AM – 10:00 PM' }],
  /* The same hours in 24h, for structured data. Keep the two in step. */
  hoursSpec: { opens: '06:00', closes: '22:00' },
  foundedYear: 2026, // TODO
} as const

/** One block of text for the clipboard, on the trial-claimed page. */
export const fullAddress = [
  `${gym.name.toUpperCase()} Gym`,
  gym.address.line1,
  gym.address.line2,
].join('\n')

/** Cap for the early-bird tier. Drives the scarcity copy in Pricing. */
export const earlyBird = {
  totalSeats: 200,
  /** Just the remaining count — the front desk updates one number. */
  seatsLeft: 20, // TODO — keep current
} as const

/** Term a plan is bought for, and how many months it covers. */
export const periodMonths = {
  month: 1,
  quarter: 3,
  'half-year': 6,
  year: 12,
} as const

export type Period = keyof typeof periodMonths

/** Suffix after the price, e.g. "₹4,000 /3 months". */
export const periodLabel: Record<Period, string> = {
  month: 'month',
  quarter: '3 months',
  'half-year': '6 months',
  year: 'year',
}

export type Plan = {
  id: string
  name: string
  price: number
  /** Billing term, used for the price suffix and the savings maths. */
  period: Period
  strikePrice?: number
  tagline: string
  features: string[]
  featured?: boolean
  badge?: string
}

/* Order is display order. Early Bird leads: it's the offer being sold, and the
   longer terms read as steps down from it rather than up from the monthly. */
export const plans: Plan[] = [
  {
    id: 'early-bird',
    name: 'Early Bird Pass',
    price: 8000,
    period: 'year',
    /* The same ₹14,000 list price the Annual Pass strikes through — both are
       yearly, so they're discounted off the same number. */
    strikePrice: 14000,
    tagline: `Founding-member rate. First ${earlyBird.totalSeats} members only.`,
    featured: true,
    badge: 'Best value',
    features: [
      'Everything in the Annual Pass',
      'Rate locked for as long as you stay a member',
      '2 free personal-training sessions',
      'Priority booking on group classes',
    ],
  },
  {
    id: 'monthly',
    name: 'Monthly Pass',
    price: 2000,
    strikePrice: 4000,
    period: 'month',
    tagline: 'No commitment. Cancel whenever.',
    features: [
      'Full gym access, all equipment',
      'Free fitness assessment on joining',
      'Locker and shower access',
      'Works out to ₹24,000 a year',
    ],
  },
  {
    id: 'quarterly',
    name: '3 Month Pass',
    price: 4000,
    strikePrice: 6000,
    period: 'quarter',
    tagline: 'A season to build the habit.',
    features: [
      'Full gym access, all equipment',
      'Free fitness assessment on joining',
      'Locker and shower access',
      'Works out to ₹1,333 a month',
    ],
  },
  {
    id: 'half-yearly',
    name: '6 Month Pass',
    price: 6000,
    strikePrice: 12000,
    period: 'half-year',
    tagline: 'Half a year, at half the monthly rate.',
    features: [
      'Full gym access, all equipment',
      'Free fitness assessment on joining',
      'Locker and shower access',
      'Works out to ₹1,000 a month',
    ],
  },
  {
    id: 'annual',
    name: 'Annual Pass',
    price: 10000,
    strikePrice: 14000,
    period: 'year',
    tagline: 'The regular yearly membership.',
    features: [
      'Full gym access, all equipment',
      'Free fitness assessment on joining',
      'Locker and shower access',
      'Personal training available as an add-on',
    ],
  },
]

/** The rate every longer term is sold against. Keep in sync with the monthly plan. */
export const monthlyRate = 2000

/** Monthly cost over a year — the number the annual plans are compared against. */
export const monthlyAnnualised = monthlyRate * 12

export const equipment = [
  {
    name: 'Free weights',
    description:
      'Full dumbbell rack to 50 kg, olympic barbells, bumper plates, and four competition-spec platforms.',
  },
  {
    name: 'Power racks',
    description:
      'Six racks with safeties, so you can squat and bench heavy without needing a spotter.',
  },
  {
    name: 'Machines',
    description:
      'Full plate-loaded and pin-loaded circuit — leg press, hack squat, cables, chest and row machines.',
  },
  {
    name: 'Cardio floor',
    description:
      'Treadmills, assault bikes, rowers and stair climbers, all with screens.',
  },
  {
    name: 'Functional zone',
    description:
      'Turf track, sleds, kettlebells, battle ropes and rigs for conditioning work.',
  },
  {
    name: 'Recovery',
    description:
      'Stretching area, foam rollers, massage guns, and clean showers and lockers.',
  },
] // TODO — replace with the gym's actual equipment

/**
 * The "Inside" section — two coaches talking about the gym, plus a walk
 * through the floor. Files go in public/videos/; add or remove entries freely,
 * the grid adapts. An entry with no video file yet shows a labelled
 * placeholder rather than breaking.
 */
export const videos = [
  {
    tag: 'Coach',
    title: 'Meet your head coach', // TODO
    caption: 'Why we set the gym up this way',
    src: '/videos/coach-1.mp4',
    poster: '/videos/coach-1.jpg',
  },
  {
    tag: 'Coach',
    title: 'How we train here', // TODO
    caption: 'Programming and form, explained',
    src: '/videos/coach-2.mp4',
    poster: '/videos/coach-2.jpg',
  },
  {
    tag: 'Gym tour',
    title: 'A walk through the gym',
    caption: 'The floor, end to end',
    src: '/videos/gym-tour.mp4',
    poster: '/videos/gym-tour.jpg',
  },
]

/**
 * Gallery of training shots. Currently Pexels stock — see public/README.md.
 * Purely atmospheric: no names, no claims, nothing presented as a maxfit
 * member. Swap for real photos of the gym when you have them.
 */
/* Keep the count divisible by 2 and 3 — the grid is 2 columns on mobile and
   3 on desktop, so 12 (or 6) fills both exactly with no ragged last row. */
export const gallery = [
  { src: '/gallery/1.jpg', alt: 'Chest work on the cable machine' },
  { src: '/gallery/2.jpg', alt: 'Battle rope conditioning' },
  { src: '/gallery/3.jpg', alt: 'Training on the leg press' },
  { src: '/gallery/4.jpg', alt: 'Conditioning work with ropes' },
  { src: '/gallery/5.jpg', alt: 'Barbell squats' },
  { src: '/gallery/6.jpg', alt: 'Strength training in the gym' },
  { src: '/gallery/7.jpg', alt: 'Dumbbell curls on the free weights floor' },
  { src: '/gallery/8.jpg', alt: 'Bodyweight and calisthenics work' },
  { src: '/gallery/9.jpg', alt: 'Lat pulldown' },
  { src: '/gallery/10.jpg', alt: 'Overhead press with dumbbells' },
  { src: '/gallery/11.jpg', alt: 'Picking weights from the dumbbell rack' },
  { src: '/gallery/12.jpg', alt: 'Lifting a loaded barbell' },
]

/* No real reviews yet, so the Results section hides itself. Uncomment and
   replace with genuine ones — these were always placeholders. */
export const reviews: {
  name: string
  plan: string
  rating: number
  text: string
}[] = []

// [
//   {
//     name: 'Member name', // TODO — real reviews only, these are placeholders
//     plan: 'Member since 2026',
//     rating: 5,
//     text: 'The coaches actually watch you lift and correct you. I learnt more about form here in a month than in two years at my last gym.',
//   },
//   {
//     name: 'Member name', // TODO
//     plan: 'Member since 2026',
//     rating: 5,
//     text: 'Never have to wait for a rack, even at 7pm. That alone was worth switching for.',
//   },
//   {
//     name: 'Member name', // TODO
//     plan: 'Member since 2026',
//     rating: 5,
//     text: 'Clean, well maintained, and the staff know everyone by name. It stopped feeling like a chore to come in.',
//   },
// ]

export const faqs = [
  {
    q: 'Is there a joining fee on top of the plan price?',
    a: 'No. The price you see is the price you pay — no registration or admission fee.', // TODO — confirm
  },
  {
    q: 'Is there a lock-in period?',
    a: 'The monthly plan has no lock-in; cancel any time. Annual plans run for twelve months from the date you join.', // TODO — confirm
  },
  {
    q: 'Can I freeze my membership if I travel?',
    a: 'Yes. Annual members can freeze for up to 15 days a year — just let the front desk know before you go.',
  },
  {
    q: 'Is personal training included?',
    a: 'Early Bird members get two free sessions. Beyond that, personal training is a separate add-on — ask at the desk for current rates.', // TODO — confirm
  },
  {
    q: 'Do you have separate timings for women?',
    a: '', // TODO — answer this, it is one of the most-asked questions
  },
  {
    q: 'Is there parking?',
    a: '', // TODO
  },
]
