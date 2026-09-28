import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import type { CategoryId, Sequence } from '../data/resume'
import { PanelFigure } from './PanelFigure'

type SequencePanelProps = {
  sequence: Sequence | null
  reducedMotion: boolean
  itemIndex: number
  itemCount: number
  navigating: boolean
  onNavigate: (direction: -1 | 1) => void
  onClose: () => void
}

/** Compact button text for the row beside the badge; the full label stays the accessible name. */
function shortLabel(label: string) {
  return label
    .replace(/^Read the case study$/i, 'Case study')
    .replace(/^Try the live demo$/i, 'Live demo')
    .replace(/^View on the /i, '')
    .replace(/^(Visit|View) /i, '')
}

const UNIT_BY_CATEGORY: Record<CategoryId, string> = {
  experience: 'Chapter',
  work: 'Build',
  craft: 'Superpower',
  contact: 'Signal',
}

/** Counts a stat like "250+" up from zero once the panel has unfolded. */
function CountUp({ value, reducedMotion }: { value: string; reducedMotion: boolean }) {
  // Whole numbers with a non-numeric suffix ("250+", "34k") count up; "4.8★" renders as-is.
  const match = value.match(/^(\d+)([^\d.]*)$/)
  const target = match ? Number(match[1]) : 0
  const [current, setCurrent] = useState(reducedMotion || !match ? target : 0)
  useEffect(() => {
    if (reducedMotion || !match) return
    let frame = 0
    const start = performance.now() + 1100
    const tick = (now: number) => {
      const progress = Math.min(Math.max((now - start) / 1300, 0), 1)
      setCurrent(Math.round(target * (1 - Math.pow(1 - progress, 4))))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, reducedMotion, match === null])
  if (!match) return <>{value}</>
  return (
    <>
      {current}
      {match[2]}
    </>
  )
}

type PanelSnapshot = { sequence: Sequence; itemIndex: number; itemCount: number }

// The connector starts flying home the instant a panel closes, so the content
// must vanish faster than the flight — any lag breaks the illusion that the
// text lived inside the connector.
const EXIT_MS = 160

/**
 * Keeps the last panel mounted (with the content it had) while it plays its
 * exit, then swaps in the next one — the "wait" handoff between panels.
 */
export function SequencePanel({ sequence, reducedMotion, itemIndex, itemCount, ...rest }: SequencePanelProps) {
  const [shown, setShown] = useState<PanelSnapshot | null>(
    sequence ? { sequence, itemIndex, itemCount } : null,
  )
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (sequence && shown?.sequence.id === sequence.id) {
      setExiting(false)
      if (shown.itemIndex !== itemIndex || shown.itemCount !== itemCount) {
        setShown({ sequence, itemIndex, itemCount })
      }
      return
    }
    if (!shown) {
      if (sequence) setShown({ sequence, itemIndex, itemCount })
      return
    }
    setExiting(true)
    const timer = window.setTimeout(() => {
      setShown(sequence ? { sequence, itemIndex, itemCount } : null)
      setExiting(false)
    }, reducedMotion ? 0 : EXIT_MS)
    return () => window.clearTimeout(timer)
  }, [sequence, itemIndex, itemCount, shown, reducedMotion])

  if (!shown) return null
  return (
    <PanelView
      key={shown.sequence.id}
      {...shown}
      {...rest}
      reducedMotion={reducedMotion}
      exiting={exiting}
    />
  )
}

function PanelView({
  sequence,
  reducedMotion,
  itemIndex,
  itemCount,
  navigating,
  exiting,
  onNavigate,
  onClose,
}: Omit<SequencePanelProps, 'sequence'> & { sequence: Sequence; exiting: boolean }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [moreBelow, setMoreBelow] = useState(false)

  const updateScrollHint = useCallback(() => {
    const node = scrollRef.current
    if (!node) return
    setMoreBelow(node.scrollHeight - node.scrollTop - node.clientHeight > 12)
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
    const frame = window.requestAnimationFrame(updateScrollHint)
    window.addEventListener('resize', updateScrollHint, { passive: true })
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', updateScrollHint)
    }
  }, [sequence, updateScrollHint])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }))
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'),
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [sequence])

  return (
    <aside
      ref={panelRef}
      className={`sequence-panel ${exiting ? 'is-exiting' : ''}`}
      style={{ '--sequence-color': sequence.color } as CSSProperties}
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      aria-label={`${sequence.label} details`}
    >
      <div className="panel-color-wash" aria-hidden="true" />
      <header className="panel-header">
        <span className="panel-code">
          <i aria-hidden="true" />
          {sequence.label}
        </span>
        <div className="panel-pager" role="group" aria-label={`${sequence.label} pages`}>
          <button
            type="button"
            aria-label="Previous"
            disabled={navigating}
            onClick={() => onNavigate(-1)}
          >
            <span aria-hidden="true">←</span>
          </button>
          <span className="panel-dots" aria-label={`${itemIndex + 1} of ${itemCount}`}>
            {Array.from({ length: itemCount }, (_, index) => (
              <i key={index} className={index === itemIndex ? 'is-current' : ''} />
            ))}
          </span>
          <button
            type="button"
            aria-label="Next"
            disabled={navigating}
            onClick={() => onNavigate(1)}
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <button ref={closeRef} className="close-button" type="button" onClick={onClose}>
          <span>Close</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>

      <div className="panel-scroll" ref={scrollRef} onScroll={updateScrollHint}>
        <div className="panel-content">
          <div className="panel-toprow">
            <p className="panel-eyebrow">
              {UNIT_BY_CATEGORY[sequence.categoryId]} {itemIndex + 1} of {itemCount}
            </p>
            {sequence.action || sequence.secondaryAction ? (
              <div className="signal-links">
                {sequence.action ? (
                  <a
                    className="signal-link"
                    href={sequence.action.href}
                    aria-label={sequence.action.label}
                    {...(sequence.action.href.startsWith('http')
                      ? { target: '_blank', rel: 'noreferrer' }
                      : {})}
                  >
                    {shortLabel(sequence.action.label)}
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 12h13M13 6l6 6-6 6" />
                    </svg>
                  </a>
                ) : null}
                {sequence.secondaryAction ? (
                  <a
                    className="signal-link is-secondary"
                    href={sequence.secondaryAction.href}
                    aria-label={sequence.secondaryAction.label}
                    {...(sequence.secondaryAction.href.startsWith('http')
                      ? { target: '_blank', rel: 'noreferrer' }
                      : {})}
                  >
                    {shortLabel(sequence.secondaryAction.label)}
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 12h13M13 6l6 6-6 6" />
                    </svg>
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
          <h2>{sequence.title}</h2>
          <p className="panel-intro">{sequence.intro}</p>
          {sequence.figure ? (
            <PanelFigure
              kind={sequence.figure}
              sequenceId={sequence.id}
              reducedMotion={reducedMotion}
            />
          ) : null}
          <div className="panel-rule" />
          <p className="panel-detail">{sequence.detail}</p>

          {sequence.stats ? (
            <dl className="panel-stats">
              {sequence.stats.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.label}</dt>
                  <dd aria-label={stat.value}>
                    <CountUp value={stat.value} reducedMotion={reducedMotion} />
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          <ul className="tag-list" aria-label="Related capabilities">
            {sequence.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>

        </div>
      </div>
      <div className={`panel-fade ${moreBelow ? 'is-visible' : ''}`} aria-hidden="true">
        <span className="panel-more">
          More below
          <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
        </span>
      </div>
    </aside>
  )
}
