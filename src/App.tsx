import { lazy, Suspense, type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HelixPlaceholder } from './components/HelixPlaceholder'
import { useReducedMotion } from './hooks/useReducedMotion'
import { Interface } from './components/Interface'
import { SequencePanel } from './components/SequencePanel'
import { categories, sequences, type CategoryId, type SequenceId } from './data/resume'

const HelixScene = lazy(() =>
  import('./components/HelixScene').then((module) => ({ default: module.HelixScene })),
)
const sequenceIds = new Set(sequences.map((sequence) => sequence.id))

function getHashSequence(): SequenceId | null {
  const hash = window.location.hash.slice(1) as SequenceId
  return sequenceIds.has(hash) ? hash : null
}

/**
 * WebGL2 on real graphics hardware. Software rasterizers (SwiftShader,
 * llvmpipe) technically work but take seconds per frame, so those visitors get
 * the static SVG helix instead of a frozen page.
 */
function canRenderWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const gl = window.WebGL2RenderingContext
      ? canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true })
      : null
    if (!gl) return false
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return !/swiftshader|llvmpipe|software/i.test(renderer)
  } catch {
    return false
  }
}

export default function App() {
  const reducedMotion = useReducedMotion()
  const [selected, setSelected] = useState<SequenceId | null>(getHashSequence)
  const [hovered, setHovered] = useState<SequenceId | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [sceneMounted, setSceneMounted] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const handleSceneReady = useCallback(() => setSceneReady(true), [])
  const [transitioning, setTransitioning] = useState(false)
  const [transitionCategory, setTransitionCategory] = useState<CategoryId | null>(null)
  const [webglAvailable] = useState(canRenderWebGL)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const navigationTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setLoaded(true), reducedMotion ? 0 : 160)
    return () => window.clearTimeout(timer)
  }, [reducedMotion])

  useEffect(() => {
    const timer = window.setTimeout(() => setSceneMounted(true), 80)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleHashChange = () => setSelected(getHashSequence())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    const nextUrl = selected
      ? `${window.location.pathname}${window.location.search}#${selected}`
      : `${window.location.pathname}${window.location.search}`
    window.history.replaceState(null, '', nextUrl)
  }, [selected])

  const activeSequence = useMemo(
    () => sequences.find((sequence) => sequence.id === selected) ?? null,
    [selected],
  )
  const activeSiblings = useMemo(
    () =>
      activeSequence
        ? sequences.filter((sequence) => sequence.categoryId === activeSequence.categoryId)
        : [],
    [activeSequence],
  )
  const activeIndex = activeSequence
    ? activeSiblings.findIndex((sequence) => sequence.id === activeSequence.id)
    : -1
  const hoveredCategory = sequences.find((sequence) => sequence.id === hovered)?.categoryId ?? null
  const glowColor = sequences.find((sequence) => sequence.id === hovered)?.color

  useEffect(() => {
    const glow = glowRef.current
    if (!glow || reducedMotion || !window.matchMedia('(pointer: fine)').matches) return
    let frame = 0
    const handleMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        glow.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`
        glow.classList.add('is-active')
      })
    }
    const handleLeave = () => glow.classList.remove('is-active')
    window.addEventListener('pointermove', handleMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', handleLeave)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', handleMove)
      document.documentElement.removeEventListener('pointerleave', handleLeave)
    }
  }, [reducedMotion])

  const handleSelect = useCallback((id: SequenceId) => {
    if (navigationTimerRef.current) window.clearTimeout(navigationTimerRef.current)
    returnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    setSelected(id)
    setHovered(null)
  }, [])

  const handleClose = useCallback(() => {
    if (navigationTimerRef.current) window.clearTimeout(navigationTimerRef.current)
    const closingCategory = activeSequence?.categoryId ?? null
    setTransitioning(Boolean(activeSequence))
    setTransitionCategory(closingCategory)
    setSelected(null)
    navigationTimerRef.current = window.setTimeout(() => {
      setTransitioning(false)
      setTransitionCategory(null)
      returnFocusRef.current?.focus({ preventScroll: true })
      navigationTimerRef.current = null
    }, reducedMotion || !activeSequence ? 40 : 760)
  }, [activeSequence, reducedMotion])

  const handleCategorySelect = useCallback((categoryId: CategoryId) => {
    const firstSequence = sequences.find((sequence) => sequence.categoryId === categoryId)
    if (firstSequence) handleSelect(firstSequence.id)
  }, [handleSelect])

  const handleNavigate = useCallback((direction: -1 | 1) => {
    if (!activeSequence || activeSiblings.length < 2 || transitioning) return
    const nextIndex = (activeIndex + direction + activeSiblings.length) % activeSiblings.length
    const nextSequence = activeSiblings[nextIndex]
    setTransitioning(true)
    setTransitionCategory(activeSequence.categoryId)
    setSelected(null)
    navigationTimerRef.current = window.setTimeout(() => {
      setSelected(nextSequence.id)
      setTransitioning(false)
      setTransitionCategory(null)
      navigationTimerRef.current = null
    }, reducedMotion ? 40 : 720)
  }, [activeIndex, activeSequence, activeSiblings, reducedMotion, transitioning])

  useEffect(
    () => () => {
      if (navigationTimerRef.current) window.clearTimeout(navigationTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [handleClose])

  return (
    <div
      className={`experience-shell ${activeSequence || transitioning ? 'has-open-panel' : ''}`}
      onKeyDownCapture={(event) => {
        if (event.key === 'Escape') handleClose()
      }}
    >
      <a className="skip-link" href="#sequence-navigation">
        Skip to résumé navigation
      </a>

      <div className="atmosphere" aria-hidden="true">
        <div className="atmosphere-haze" />
        <div className="atmosphere-noise" />
        <div className="atmosphere-grid" />
        <div
          ref={glowRef}
          className="cursor-glow"
          style={glowColor ? ({ '--glow-color': glowColor } as CSSProperties) : undefined}
        />
      </div>

      {webglAvailable && sceneMounted ? (
        <Suspense fallback={null}>
          <HelixScene
            sequences={sequences}
            selected={selected}
            hovered={hovered}
            paused={Boolean(selected) || transitioning}
            reducedMotion={reducedMotion}
            itemIndex={activeIndex}
            itemCount={activeSiblings.length}
            navigating={transitioning}
            onSelect={handleSelect}
            onHover={setHovered}
            onNavigate={handleNavigate}
            onClose={handleClose}
            onReady={handleSceneReady}
          />
        </Suspense>
      ) : null}
      {/* Shown while the 3D chunk loads and its first frames compile, then
          crossfades out; it stays for good when WebGL is unavailable. */}
      <HelixPlaceholder hidden={webglAvailable && sceneReady} />

      <div id="sequence-navigation" tabIndex={-1}>
        <Interface
          categories={categories}
          selectedCategory={activeSequence?.categoryId ?? transitionCategory}
          hoveredCategory={hoveredCategory}
          loaded={loaded}
          onSelect={handleCategorySelect}
        />
      </div>

      <SequencePanel
        sequence={activeSequence}
        reducedMotion={reducedMotion}
        itemIndex={activeIndex}
        itemCount={activeSiblings.length}
        navigating={transitioning}
        onNavigate={handleNavigate}
        onClose={handleClose}
      />

    </div>
  )
}
