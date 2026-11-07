const header = document.querySelector('[data-header]')
const menuButton = document.querySelector('[data-menu-button]')
const sheet = document.getElementById('mobile-nav')
let menuOpen = false

function paintHeader() {
  header.toggleAttribute('data-solid', window.scrollY > 16 && !menuOpen)
}

function setMenu(open) {
  menuOpen = open
  sheet.hidden = !open
  menuButton.setAttribute('aria-expanded', String(open))
  document.body.style.overflow = open ? 'hidden' : ''
  paintHeader()
}

paintHeader()
window.addEventListener('scroll', paintHeader, { passive: true })
menuButton.addEventListener('click', () => setMenu(!menuOpen))
sheet.addEventListener('click', (e) => {
  if (e.target.closest('a')) setMenu(false)
})
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuOpen) setMenu(false)
})

for (const card of document.querySelectorAll('[data-video]')) {
  const video = card.querySelector('video')
  const play = card.querySelector('[data-play]')
  const mute = card.querySelector('[data-mute]')
  const title = card.querySelector('h3').textContent

  const paint = () => {
    card.toggleAttribute('data-playing', !video.paused)
    play.setAttribute('aria-label', `${video.paused ? 'Play' : 'Pause'} ${title}`)
  }
  video.addEventListener('play', paint)
  video.addEventListener('pause', paint)
  video.addEventListener('ended', paint)

  play.addEventListener('click', () => (video.paused ? video.play() : video.pause()))
  mute.addEventListener('click', () => {
    video.muted = !video.muted
    card.toggleAttribute('data-unmuted', !video.muted)
    mute.setAttribute('aria-pressed', String(!video.muted))
    mute.setAttribute('aria-label', `${video.muted ? 'Unmute' : 'Mute'} ${title}`)
  })
}

/* A live map swallows one-finger scrolling halfway down the page, so the
   keyless embed waits for a tap. The keyed Embed API labels the pin itself. */
const map = document.querySelector('[data-map]')
if (map) {
  const frame = map.querySelector('iframe')
  const cover = map.querySelector('button')
  const activate = () => {
    frame.classList.remove('pointer-events-none')
    frame.removeAttribute('tabindex')
    cover.remove()
  }
  const key = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY
  if (key) {
    const query =
      'MAXFIT GYM, Site No A, Kithaganur Main Rd, Krishnarajapuram, Kithiganur, Bengaluru, Karnataka 560036'
    frame.src = `https://www.google.com/maps/embed/v1/place?key=${key}&q=${encodeURIComponent(query)}&zoom=18`
    activate()
  } else {
    cover.addEventListener('click', activate)
  }
}

for (const el of document.querySelectorAll('[data-year]')) {
  el.textContent = String(new Date().getFullYear())
}

const token = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN
const host = import.meta.env.VITE_PUBLIC_POSTHOG_HOST
let posthog = null
const queued = []

if (token && host) {
  import('posthog-js')
    .then(({ default: client }) => {
      client.init(token, {
        api_host: host,
        defaults: '2026-01-30',
        capture_exceptions: true,
        session_recording: { maskAllInputs: true },
      })
      posthog = client
      for (const [name, properties] of queued.splice(0)) client.capture(name, properties)
    })
    .catch((err) => console.error('PostHog failed to load', err))
}

function capture(name, properties) {
  if (posthog) posthog.capture(name, properties)
  else if (token && host) queued.push([name, properties])
}

function actionOf(href) {
  if (href.startsWith('tel:')) return 'call'
  if (href.startsWith('mailto:')) return 'email'
  if (href.includes('wa.me/')) return 'whatsapp'
  if (href.includes('instagram.com/')) return 'instagram'
  return null
}

/* `location` is the [data-cta] area the link sits in, so the nav's Call now
   can be told apart from the sticky bar's. */
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]')
  const area = link?.closest('[data-cta]')
  const action = link && actionOf(link.getAttribute('href'))
  if (!area || !action) return
  const plan = link.closest('[data-plan]')?.dataset.plan
  capture('cta_clicked', { action, location: area.dataset.cta, ...(plan ? { plan } : {}) })
})
