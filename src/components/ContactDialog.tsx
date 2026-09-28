import { useEffect, useRef, useState, type FormEvent } from 'react'
import { track } from '../analytics'

const ENDPOINT = 'https://portfolio-contact-eight.vercel.app/api/contact'
export const CONTACT_EMAIL = 'montabano1@gmail.com'

type ContactDialogProps = {
  /** Why the form was opened, e.g. "role" from the availability pill; null keeps it closed. */
  context: string | null
  onClose: () => void
}

type Status = 'idle' | 'sending' | 'sent' | 'error'
type FieldErrors = Partial<Record<'name' | 'email' | 'company' | 'message', string>>

const COPY: Record<string, { title: string; intro: string; placeholder: string }> = {
  role: {
    title: 'Hiring for a forward-deployed role?',
    intro: 'Tell me about the team and the problem. I read everything and reply personally.',
    placeholder: 'The role, the team, and what you’d want me to build…',
  },
  general: {
    title: 'Get in touch',
    intro: 'A role, a project, or a hard problem — tell me what you’re working on.',
    placeholder: 'What you’re working on and how I can help…',
  },
}

export function ContactDialog({ context, onClose }: ContactDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openedAt = useRef(0)
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [copied, setCopied] = useState(false)
  const copy = COPY[context ?? 'general'] ?? COPY.general

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (context && !dialog.open) {
      setStatus('idle')
      setErrors({})
      openedAt.current = Date.now()
      dialog.showModal()
      track('contact_open', { context })
    } else if (!context && dialog.open) {
      dialog.close()
    }
  }, [context])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      company: String(form.get('company') ?? ''),
      message: String(form.get('message') ?? ''),
      website: String(form.get('website') ?? ''),
      context: context ?? 'general',
      elapsedMs: Date.now() - openedAt.current,
    }
    setStatus('sending')
    setErrors({})
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => ({}))
      if (response.ok) {
        setStatus('sent')
        track('contact_submit', { context: payload.context })
        return
      }
      if (result.fields) setErrors(result.fields)
      setStatus(result.fields ? 'idle' : 'error')
      track('contact_error', { reason: result.error ?? response.status })
    } catch {
      setStatus('error')
      track('contact_error', { reason: 'network' })
    }
  }

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard blocked: the address is on screen to copy by hand.
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="contact-dialog"
      aria-labelledby="contact-title"
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog element itself.
        if (event.target === event.currentTarget) event.currentTarget.close()
      }}
    >
      <div className="contact-card">
        <button className="contact-close" type="button" aria-label="Close" onClick={() => dialogRef.current?.close()}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        {status === 'sent' ? (
          <div className="contact-sent" role="status">
            <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" /><path d="M14 25l7 7 13-15" /></svg>
            <h2 id="contact-title">Message sent</h2>
            <p>Thanks — it’s in my inbox, and I’ll reply personally.</p>
            <button className="contact-submit" type="button" onClick={() => dialogRef.current?.close()}>Done</button>
          </div>
        ) : (
          <>
            <h2 id="contact-title">{copy.title}</h2>
            <p className="contact-intro">{copy.intro}</p>
            <form onSubmit={submit} noValidate>
              <div className="contact-row">
                <label>
                  <span>Name</span>
                  <input name="name" autoComplete="name" required maxLength={100} aria-invalid={Boolean(errors.name)} />
                  {errors.name ? <em>{errors.name}</em> : null}
                </label>
                <label>
                  <span>Email</span>
                  <input name="email" type="email" autoComplete="email" required maxLength={200} aria-invalid={Boolean(errors.email)} />
                  {errors.email ? <em>{errors.email}</em> : null}
                </label>
              </div>
              <label>
                <span>Company <small>optional</small></span>
                <input name="company" autoComplete="organization" maxLength={150} />
              </label>
              <label>
                <span>Message</span>
                <textarea name="message" rows={5} required maxLength={5000} placeholder={copy.placeholder} aria-invalid={Boolean(errors.message)} />
                {errors.message ? <em>{errors.message}</em> : null}
              </label>
              {/* Honeypot: invisible to people, irresistible to bots. */}
              <label className="contact-trap" aria-hidden="true">
                Website <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
              {status === 'error' ? (
                <p className="contact-error" role="alert">
                  That didn’t send. Please try again, or email me directly below.
                </p>
              ) : null}
              <button className="contact-submit" type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send message'}
              </button>
            </form>
            <p className="contact-direct">
              Prefer your own email? Write to{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              <button type="button" onClick={copyEmail}>{copied ? 'Copied' : 'Copy'}</button>
            </p>
          </>
        )}
      </div>
    </dialog>
  )
}
