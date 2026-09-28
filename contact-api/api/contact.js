// POST /api/contact — the portfolio's contact form.
// Validates the message, drops bots quietly, and emails Michael through Resend
// with the sender as Reply-To. Secrets live in Vercel env vars:
//   RESEND_API_KEY  (required)   CONTACT_TO  (defaults below)

const TO = process.env.CONTACT_TO ?? 'montabano1@gmail.com'
const FROM = process.env.CONTACT_FROM ?? 'Portfolio contact <onboarding@resend.dev>'
const ALLOWED_ORIGINS = new Set([
  'https://www.michaelmontalbano.com',
  'https://michaelmontalbano.com',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5300',
  'http://localhost:5173',
])
const LIMITS = { name: 100, email: 200, company: 150, message: 5000, context: 60 }
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
// Best-effort per-instance rate limit: 5 messages per IP per 10 minutes.
const WINDOW_MS = 10 * 60 * 1000
const hits = new Map()

function cors(req, res) {
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  return !origin || ALLOWED_ORIGINS.has(origin)
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

function limited(ip) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > 5
}

export default async function handler(req, res) {
  const allowed = cors(req, res)
  if (req.method === 'OPTIONS') return res.status(allowed ? 204 : 403).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  if (!allowed) return res.status(403).json({ error: 'origin_not_allowed' })

  const body = typeof req.body === 'string' ? safeJson(req.body) : req.body ?? {}
  const field = (key) => (typeof body[key] === 'string' ? body[key].trim() : '')
  const name = field('name')
  const email = field('email')
  const company = field('company')
  const message = field('message')
  const context = field('context')

  // Bots: a filled hidden field or a form submitted faster than a human could.
  const elapsed = Number(body.elapsedMs)
  if (field('website') || (Number.isFinite(elapsed) && elapsed < 3000)) return res.status(200).json({ ok: true })

  const errors = {}
  if (!name || name.length > LIMITS.name) errors.name = 'Please add your name.'
  if (!EMAIL.test(email) || email.length > LIMITS.email) errors.email = 'Please use a valid email address.'
  if (company.length > LIMITS.company) errors.company = 'That’s a bit long.'
  if (message.length < 10 || message.length > LIMITS.message) errors.message = 'Please write at least a sentence.'
  if (Object.keys(errors).length) return res.status(400).json({ error: 'invalid', fields: errors })

  const ip = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || 'unknown'
  if (limited(ip)) return res.status(429).json({ error: 'rate_limited' })

  const key = process.env.RESEND_API_KEY
  if (!key) return res.status(500).json({ error: 'not_configured' })

  const about = context.slice(0, LIMITS.context) || 'general'
  const subject = `Portfolio: ${name}${company ? ` (${company})` : ''} — ${about}`
  const header = [`From: ${name} <${email}>`, company ? `Company: ${company}` : null, `Via: ${about}`].filter(Boolean)
  const lines = [...header, '', message]
  const html = `<div style="font:15px/1.6 -apple-system,Segoe UI,sans-serif;color:#1d2129">
<p style="margin:0 0 12px"><b>${escapeHtml(name)}</b> &lt;${escapeHtml(email)}&gt;${company ? `<br>${escapeHtml(company)}` : ''}<br><span style="color:#6b727d">via ${escapeHtml(about)}</span></p>
<p style="white-space:pre-wrap;margin:0">${escapeHtml(message)}</p></div>`

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [TO], reply_to: email, subject, text: lines.join('\n'), html }),
  })
  if (!response.ok) {
    console.error('resend_failed', response.status, await response.text())
    return res.status(502).json({ error: 'send_failed' })
  }
  return res.status(200).json({ ok: true })
}

function safeJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}
