import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import type { CategoryId, Sequence } from '../data/resume'

type SequencePanelProps = {
  sequence: Sequence | null
  reducedMotion: boolean
  itemIndex: number
  itemCount: number
  navigating: boolean
  onNavigate: (direction: -1 | 1) => void
  onClose: () => void
}

const UNIT_BY_CATEGORY: Record<CategoryId, string> = {
  experience: 'Chapter',
  work: 'Build',
  craft: 'Superpower',
  contact: 'Signal',
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const [moreBelow, setMoreBelow] = useState(false)

  const updateScrollHint = useCallback(() => {
    const node = scrollRef.current
    if (!node) return
    setMoreBelow(node.scrollHeight - node.scrollTop - node.clientHeight > 12)
  }, [])

  useEffect(() => {
    if (!sequence) return
    scrollRef.current?.scrollTo({ top: 0 })
    const frame = window.requestAnimationFrame(updateScrollHint)
    window.addEventListener('resize', updateScrollHint, { passive: true })
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', updateScrollHint)
    }
  }, [sequence, updateScrollHint])

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
              <p className="panel-eyebrow">
                {UNIT_BY_CATEGORY[sequence.categoryId]} {itemIndex + 1} of {itemCount}
              </p>
              <h2>{sequence.title}</h2>
              <p className="panel-intro">{sequence.intro}</p>
              <div className="panel-rule" />
              <p className="panel-detail">{sequence.detail}</p>

              {sequence.stats ? (
                <dl className="panel-stats">
                  {sequence.stats.map((stat) => (
                    <div key={stat.label}>
                      <dt>{stat.label}</dt>
                      <dd>{stat.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              <ul className="tag-list" aria-label="Related capabilities">
                {sequence.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>

              {sequence.action || sequence.secondaryAction ? (
                <div className="signal-links">
                  {sequence.action ? (
                    <a
                      className="signal-link"
                      href={sequence.action.href}
                      {...(sequence.action.href.startsWith('http')
                        ? { target: '_blank', rel: 'noreferrer' }
                        : {})}
                    >
                      {sequence.action.label}
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 12h13M13 6l6 6-6 6" />
                      </svg>
                    </a>
                  ) : null}
                  {sequence.secondaryAction ? (
                    <a
                      className="signal-link is-secondary"
                      href={sequence.secondaryAction.href}
                      {...(sequence.secondaryAction.href.startsWith('http')
                        ? { target: '_blank', rel: 'noreferrer' }
                        : {})}
                    >
                      {sequence.secondaryAction.label}
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 12h13M13 6l6 6-6 6" />
                      </svg>
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
          <div className={`panel-fade ${moreBelow ? 'is-visible' : ''}`} aria-hidden="true" />
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}
