import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, type CSSProperties } from 'react'
import type { Sequence } from '../data/resume'

type SequencePanelProps = {
  sequence: Sequence | null
  reducedMotion: boolean
  itemIndex: number
  itemCount: number
  navigating: boolean
  onNavigate: (direction: -1 | 1) => void
  onClose: () => void
}

const panelMotion = {
  hidden: {
    opacity: 0,
    x: -28,
    clipPath: 'inset(0% 62% 92% 0 round 999px)',
  },
  visible: {
    opacity: 1,
    x: 0,
    clipPath: 'inset(0% 0% 0% 0 round 0px)',
  },
  exit: {
    opacity: 0,
    x: -24,
    clipPath: 'inset(0% 62% 92% 0 round 999px)',
  },
}

export function SequencePanel({
  sequence,
  reducedMotion,
  itemIndex,
  itemCount,
  navigating,
  onNavigate,
  onClose,
}: SequencePanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sequence) return
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
    <AnimatePresence mode="wait">
      {sequence ? (
        <motion.aside
          ref={panelRef}
          key={sequence.id}
          className="sequence-panel"
          style={{ '--sequence-color': sequence.color } as CSSProperties}
          role="dialog"
          aria-modal="true"
          aria-live="polite"
          aria-label={`${sequence.label} details`}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={panelMotion}
          transition={{
            duration: reducedMotion ? 0 : 0.82,
            delay: reducedMotion ? 0 : 0.56,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <div className="panel-color-wash" aria-hidden="true" />
          <header className="panel-header">
            <span className="panel-code">{sequence.code} · {sequence.label}</span>
            <button ref={closeRef} className="close-button" type="button" onClick={onClose}>
              <span>Close</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>

          <div className="panel-content">
            <p className="panel-eyebrow">
              Building block {String(itemIndex + 1).padStart(2, '0')}
            </p>
            <h2>{sequence.title}</h2>
            <p className="panel-intro">{sequence.intro}</p>
            <div className="panel-rule" />
            <p className="panel-detail">{sequence.detail}</p>

            <ul className="tag-list" aria-label="Related capabilities">
              {sequence.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>

            <div className="panel-navigation" aria-label={`${sequence.label} pages`}>
              <button type="button" disabled={navigating} onClick={() => onNavigate(-1)}>
                <span aria-hidden="true">←</span>
                Previous
              </button>
              <span className="panel-position">
                {String(itemIndex + 1).padStart(2, '0')}
                <i>/</i>
                {String(itemCount).padStart(2, '0')}
              </span>
              <button type="button" disabled={navigating} onClick={() => onNavigate(1)}>
                Next
                <span aria-hidden="true">→</span>
              </button>
            </div>

            {sequence.action ? (
              <a className="signal-link" href={sequence.action.href}>
                {sequence.action.label}
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </a>
            ) : null}
          </div>

        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}
