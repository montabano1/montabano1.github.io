/*
 * Google Analytics 4, loaded only on the production domain so local
 * development and test runs never pollute the data. Append ?analytics=debug to
 * any URL to force it on and stream events to GA4's DebugView instead.
 *
 * Besides GA4's built-in page views, sources, outbound clicks, and scroll depth,
 * a few job-search signals are sent as named events: résumé opens, "open to
 * roles" and email clicks, project panel opens, and case-study visits.
 */

const MEASUREMENT_ID = 'G-QX3J7BJKWZ'

type Gtag = (...args: unknown[]) => void
declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

const debug = new URLSearchParams(window.location.search).get('analytics') === 'debug'
const enabled = debug || /(^|\.)michaelmontalbano\.com$/.test(window.location.hostname)

export function track(event: string, params: Record<string, string | number> = {}) {
  if (!enabled || !window.gtag) return
  window.gtag('event', event, params)
}

function linkLabel(link: HTMLAnchorElement) {
  return link.dataset.analytics ?? link.textContent?.replace(/\s+/g, ' ').trim().slice(0, 80) ?? ''
}

/** One delegated listener classifies every click that matters. */
function trackClicks(event: MouseEvent) {
  const link = (event.target as Element | null)?.closest?.('a')
  if (!link) return
  const href = link.getAttribute('href') ?? ''
  const where = window.location.pathname
  if (href.endsWith('resume.pdf')) track('resume_open', { link_text: linkLabel(link), page_path: where })
  else if (link.classList.contains('availability')) track('open_to_roles_click', { page_path: where })
  else if (href.startsWith('mailto:')) track('email_click', { link_text: linkLabel(link), page_path: where })
  else if (/^\/(paddlescreens|beleeg)\/?$/.test(href)) {
    track('case_study_click', { case_study: href.replace(/\//g, ''), page_path: where })
  }
}

let started = false

export function initAnalytics() {
  if (!enabled || started) return
  started = true
  window.dataLayer = window.dataLayer ?? []
  window.gtag = function gtag() {
    // GA's loader expects the raw arguments object, not an array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', MEASUREMENT_ID, debug ? { debug_mode: true } : {})
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)
  document.addEventListener('click', trackClicks, { capture: true })
}
