import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react'
import type { Sequence, SequenceId } from '../data/resume'
import { HelixRenderer, orderSequences } from '../scene/helixRenderer'

type SceneProps = {
  sequences: Sequence[]
  selected: SequenceId | null
  hovered: SequenceId | null
  paused: boolean
  reducedMotion: boolean
  itemIndex: number
  itemCount: number
  navigating: boolean
  onSelect: (id: SequenceId) => void
  onHover: (id: SequenceId | null) => void
  onNavigate: (direction: -1 | 1) => void
  onClose: () => void
  onReady?: () => void
}

type RowRefs = RefObject<Record<string, HTMLDivElement | null>>

/**
 * Invisible DOM hit targets that track each connector on screen: they give the
 * helix keyboard focus, accessible names, and cheap pointer hit-testing. The
 * renderer moves them by transform only.
 */
const ConnectorPlayground = memo(function ConnectorPlayground({
  sequences,
  selected,
  onSelect,
  onHover,
  rows,
}: Pick<SceneProps, 'sequences' | 'selected' | 'onSelect' | 'onHover'> & { rows: RowRefs }) {
  const previousSelected = useRef<SequenceId | null>(null)
  const [returningId, setReturningId] = useState<SequenceId | null>(null)
  const orderedSequences = useMemo(() => orderSequences(sequences), [sequences])

  useLayoutEffect(() => {
    const previous = previousSelected.current
    previousSelected.current = selected
    if (!previous || selected) return
    setReturningId(previous)
    const timer = window.setTimeout(() => setReturningId(null), 760)
    return () => window.clearTimeout(timer)
  }, [selected])

  useLayoutEffect(() => {
    if (selected) rows.current[selected]?.focus({ preventScroll: true })
  }, [selected])

  return (
    <div className="connector-playground">
      {orderedSequences.map((sequence) => {
        const isSelected = selected === sequence.id
        const isReturning = returningId === sequence.id
        const isMuted = selected !== null && !isSelected
        return (
          <div
            key={sequence.id}
            ref={(node) => { rows.current[sequence.id] = node }}
            className={[
              'connector-row',
              isSelected ? 'is-expanded' : 'is-contracted',
              isReturning ? 'is-returning' : '',
              isMuted ? 'is-muted' : '',
            ].join(' ')}
            style={{ '--sequence-color': sequence.color } as CSSProperties}
            role={isSelected ? undefined : 'button'}
            aria-label={isSelected ? undefined : `Open ${sequence.title}`}
            aria-expanded={isSelected ? undefined : false}
            aria-hidden={isSelected ? true : undefined}
            tabIndex={isSelected ? -1 : isMuted ? -1 : 0}
            onClick={() => {
              if (!isSelected && !isMuted) onSelect(sequence.id)
            }}
            onKeyDown={(event) => {
              if (!isSelected && !isMuted && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault()
                onSelect(sequence.id)
              }
            }}
            onPointerEnter={() => {
              if (!isMuted) onHover(sequence.id)
            }}
            onPointerLeave={() => onHover(null)}
            onFocus={() => onHover(sequence.id)}
            onBlur={() => onHover(null)}
          />
        )
      })}
    </div>
  )
})

export function HelixScene({
  sequences,
  selected,
  hovered,
  paused,
  reducedMotion,
  onSelect,
  onHover,
  onReady,
}: SceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<HelixRenderer | null>(null)
  const rows = useRef<Record<string, HTMLDivElement | null>>({})
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady
  const [ready, setReady] = useState(false)

  // The renderer owns its own loop; React creates it once and feeds it state.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const renderer = new HelixRenderer({
      canvas,
      sequences,
      rows: rows.current,
      reducedMotion,
      onReady: () => {
        setReady(true)
        onReadyRef.current?.()
      },
    })
    rendererRef.current = renderer
    const observer = new ResizeObserver(() => renderer.resize())
    observer.observe(canvas)
    return () => {
      observer.disconnect()
      renderer.dispose()
      rendererRef.current = null
    }
  }, [sequences, reducedMotion])

  useEffect(() => {
    rendererRef.current?.update({ selected, hovered, paused })
  }, [selected, hovered, paused, sequences, reducedMotion])

  return (
    <>
      <div className={`molecular-canvas ${ready ? 'is-ready' : ''}`}>
        <canvas ref={canvasRef} />
      </div>
      <ConnectorPlayground
        rows={rows}
        sequences={sequences}
        selected={selected}
        onSelect={onSelect}
        onHover={onHover}
      />
    </>
  )
}
