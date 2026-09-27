import {
  Environment,
  Instance,
  Instances,
  Lightformer,
  RoundedBox,
} from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import {
  memo,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react'
import {
  CatmullRomCurve3,
  Color,
  Group,
  MathUtils,
  MeshPhysicalMaterial,
  Quaternion,
  Vector3,
} from 'three'
import type { Sequence, SequenceId } from '../data/resume'

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

const HELIX_POINTS = 34
const HELIX_RADIUS = 1.35
const HELIX_STEP = 0.34
const HELIX_TWIST = 0.56
const markerIndices = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]

const HelixStructure = memo(function HelixStructure() {
  const geometry = useMemo(() => {
    const a: Vector3[] = []
    const b: Vector3[] = []
    for (let index = 0; index < HELIX_POINTS; index += 1) {
      const y = (index - (HELIX_POINTS - 1) / 2) * HELIX_STEP
      const angle = index * HELIX_TWIST
      a.push(new Vector3(Math.cos(angle) * HELIX_RADIUS, y, Math.sin(angle) * HELIX_RADIUS))
      b.push(
        new Vector3(
          Math.cos(angle + Math.PI) * HELIX_RADIUS,
          y,
          Math.sin(angle + Math.PI) * HELIX_RADIUS,
        ),
      )
    }
    return {
      strandA: new CatmullRomCurve3(a, false, 'catmullrom', 0.5),
      strandB: new CatmullRomCurve3(b, false, 'catmullrom', 0.5),
    }
  }, [])

  return (
    <group>
      <mesh>
        <tubeGeometry args={[geometry.strandA, 180, 0.078, 12, false]} />
        <meshPhysicalMaterial
          color="#aeb9b4"
          roughness={0.46}
          metalness={0.04}
          clearcoat={0.28}
          clearcoatRoughness={0.52}
          iridescence={0.24}
          iridescenceIOR={1.35}
        />
      </mesh>
      <mesh>
        <tubeGeometry args={[geometry.strandB, 180, 0.078, 12, false]} />
        <meshPhysicalMaterial
          color="#7f8e89"
          roughness={0.5}
          metalness={0.03}
          clearcoat={0.22}
          clearcoatRoughness={0.56}
          iridescence={0.18}
          iridescenceIOR={1.3}
        />
      </mesh>
    </group>
  )
})

const ConnectionSockets = memo(function ConnectionSockets({ sequences }: { sequences: Sequence[] }) {
  const groups = useMemo(() => {
    const byColor = new Map<string, Vector3[]>()
    orderSequences(sequences).forEach((sequence, index) => {
      const points = byColor.get(sequence.color) ?? []
      const endpoints = connectorEndpoints(markerIndices[index])
      points.push(endpoints.start, endpoints.end)
      byColor.set(sequence.color, points)
    })
    return Array.from(byColor.entries())
  }, [sequences])

  return (
    <>
      {groups.map(([color, points]) => (
        <Instances key={color} limit={points.length}>
          <sphereGeometry args={[0.108, 16, 16]} />
          <meshPhysicalMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.08}
            roughness={0.36}
            metalness={0.02}
            clearcoat={0.25}
          />
          {points.map((point, index) => <Instance key={index} position={point} />)}
        </Instances>
      ))}
    </>
  )
})

function orderSequences(sequences: Sequence[]) {
  const categoryOrder = ['experience', 'work', 'craft', 'contact']
  const rounds = Math.max(
    ...categoryOrder.map(
      (categoryId) => sequences.filter((item) => item.categoryId === categoryId).length,
    ),
  )
  return Array.from({ length: rounds }, (_, round) => round).flatMap((round) =>
    categoryOrder.flatMap((categoryId) => {
      const sequence = sequences.filter((item) => item.categoryId === categoryId)[round]
      return sequence ? [sequence] : []
    }),
  )
}

function connectorEndpoints(index: number) {
  const y = (index - (HELIX_POINTS - 1) / 2) * HELIX_STEP
  const angle = index * HELIX_TWIST
  return {
    start: new Vector3(
      Math.cos(angle) * HELIX_RADIUS,
      y,
      Math.sin(angle) * HELIX_RADIUS,
    ),
    end: new Vector3(
      Math.cos(angle + Math.PI) * HELIX_RADIUS,
      y,
      Math.sin(angle + Math.PI) * HELIX_RADIUS,
    ),
  }
}

type RowRefs = RefObject<Record<string, HTMLDivElement | null>>

/**
 * Invisible DOM hit targets that track each connector on screen: they give the
 * helix keyboard focus, accessible names, and cheap pointer hit-testing. They
 * live beside the canvas (not inside drei's <Html>, which re-renders a separate
 * React root on every parent render) and move by transform only.
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
            >
            </div>
          )
        })}
    </div>
  )
})

const MeshConnector = memo(function MeshConnector({
  sequence,
  markerIndex,
  selected,
  hovered,
  muted,
  reducedMotion,
  onSelect,
  onHover,
}: {
  sequence: Sequence
  markerIndex: number
  selected: boolean
  hovered: boolean
  muted: boolean
  reducedMotion: boolean
  onSelect: (id: SequenceId) => void
  onHover: (id: SequenceId | null) => void
}) {
  const outerRef = useRef<Group>(null)
  const connectorRef = useRef<Group>(null)
  const materialRef = useRef<MeshPhysicalMaterial>(null)
  const { camera, size, viewport } = useThree()
  const endpoints = useMemo(() => connectorEndpoints(markerIndex), [markerIndex])
  const transform = useMemo(() => {
    const direction = endpoints.end.clone().sub(endpoints.start)
    return {
      midpoint: endpoints.start.clone().add(endpoints.end).multiplyScalar(0.5),
      quaternion: new Quaternion().setFromUnitVectors(
        new Vector3(1, 0, 0),
        direction.clone().normalize(),
      ),
      length: direction.length(),
    }
  }, [endpoints])
  const parentQuaternion = useMemo(() => new Quaternion(), [])
  const targetQuaternion = useMemo(() => new Quaternion(), [])
  const scratchTarget = useMemo(() => new Vector3(), [])
  const viewportTarget = useMemo(() => new Vector3(), [])
  const parentScale = useMemo(() => new Vector3(1, 1, 1), [])
  const baseColor = useMemo(() => new Color(sequence.color), [sequence.color])
  const highlightColor = useMemo(
    () => baseColor.clone().lerp(new Color('#ffffff'), 0.3),
    [baseColor],
  )
  const panelColor = useMemo(() => new Color('#111521'), [])

  useFrame((_, delta) => {
    if (!outerRef.current || !connectorRef.current) return
    const parent = outerRef.current.parent
    const compact = size.width < 760
    const currentViewport = viewport.getCurrentViewport(camera, viewportTarget.set(0, 0, 0))
    const targetPixelWidth = compact ? size.width * 0.94 : Math.min(size.width * 0.42, 640)
    const targetWidth = currentViewport.width * (targetPixelWidth / size.width)
    const targetHeight = currentViewport.height * (compact ? 0.88 : 0.6)
    const targetCenterX = compact
      ? size.width * 0.5
      : size.width * 0.95 - targetPixelWidth * 0.5
    const worldTarget = scratchTarget.set(
      currentViewport.width * (targetCenterX / size.width - 0.5),
      0,
      0,
    )
    const destination = selected && parent
      ? parent.worldToLocal(worldTarget)
      : transform.midpoint
    const damping = reducedMotion ? 100 : selected ? 5.2 : 7
    outerRef.current.position.x = MathUtils.damp(outerRef.current.position.x, destination.x, damping, delta)
    outerRef.current.position.y = MathUtils.damp(outerRef.current.position.y, destination.y, damping, delta)
    outerRef.current.position.z = MathUtils.damp(outerRef.current.position.z, destination.z, damping, delta)

    if (selected && parent) {
      parent.getWorldQuaternion(parentQuaternion)
      targetQuaternion.copy(parentQuaternion).invert().multiply(camera.quaternion)
    } else {
      targetQuaternion.identity()
    }
    outerRef.current.quaternion.slerp(
      targetQuaternion,
      reducedMotion ? 1 : 1 - Math.exp(-delta * 6),
    )
    connectorRef.current.quaternion.slerp(
      selected ? targetQuaternion.identity() : transform.quaternion,
      reducedMotion ? 1 : 1 - Math.exp(-delta * 7),
    )
    // The panel target is measured in world units, but this connector lives
    // inside a group that is scaled down on compact viewports — divide the
    // parent's world scale back out or the expanded box undershoots the panel.
    if (parent) parent.getWorldScale(parentScale)
    const scaleX = selected ? targetWidth / (transform.length * parentScale.x) : 1
    const scaleY = selected ? targetHeight / (0.18 * parentScale.y) : 1
    connectorRef.current.scale.x = MathUtils.damp(connectorRef.current.scale.x, scaleX, damping, delta)
    connectorRef.current.scale.y = MathUtils.damp(connectorRef.current.scale.y, scaleY, damping, delta)
    connectorRef.current.scale.z = MathUtils.damp(connectorRef.current.scale.z, selected ? 1.8 : 1, damping, delta)

    if (materialRef.current) {
      const targetColor = selected ? panelColor : hovered ? highlightColor : baseColor
      materialRef.current.color.lerp(targetColor, 1 - Math.exp(-delta * 9))
      materialRef.current.emissiveIntensity = MathUtils.damp(
        materialRef.current.emissiveIntensity,
        selected ? 0.025 : hovered ? 0.28 : 0.1,
        9,
        delta,
      )
      materialRef.current.opacity = MathUtils.damp(
        materialRef.current.opacity,
        muted ? 0.16 : 1,
        7,
        delta,
      )
    }
  })

  return (
    <group ref={outerRef} position={transform.midpoint}>
      <group
        ref={connectorRef}
        quaternion={transform.quaternion}
        onClick={(event) => {
          event.stopPropagation()
          if (!muted && !selected) onSelect(sequence.id)
        }}
        onPointerEnter={(event) => {
          event.stopPropagation()
          if (!muted) onHover(sequence.id)
        }}
        onPointerLeave={() => onHover(null)}
      >
        <RoundedBox args={[transform.length, 0.18, 0.11]} radius={0.075} smoothness={3}>
          <meshPhysicalMaterial
            ref={materialRef}
            color={sequence.color}
            emissive={sequence.color}
            emissiveIntensity={selected ? 0.025 : 0.1}
            roughness={selected ? 0.54 : 0.32}
            metalness={0.02}
            clearcoat={selected ? 0.08 : 0.35}
            clearcoatRoughness={0.46}
            transparent
          />
        </RoundedBox>
      </group>
    </group>
  )
})

const ROW_BASE_WIDTH = 100
const ROW_BASE_HEIGHT = 18

function MolecularHelix({
  sequences,
  selected,
  hovered,
  paused,
  reducedMotion,
  onSelect,
  onHover,
  compactRendering,
  rows,
}: Pick<
  SceneProps,
  'sequences' | 'selected' | 'hovered' | 'paused' | 'reducedMotion' | 'onSelect' | 'onHover'
> & { compactRendering: boolean; rows: RowRefs }) {
  const group = useRef<Group>(null)
  const lastWrites = useRef<Record<string, string>>({})
  const { camera, size } = useThree()
  const orderedSequences = useMemo(() => orderSequences(sequences), [sequences])
  const layouts = useMemo(
    () => orderedSequences.map((sequence, index) => ({
      sequence,
      ...connectorEndpoints(markerIndices[index]),
    })),
    [orderedSequences],
  )
  const projectedStart = useMemo(() => new Vector3(), [])
  const projectedEnd = useMemo(() => new Vector3(), [])

  useFrame((state, delta) => {
    if (!group.current) return
    const targetSpeed = paused || reducedMotion ? 0 : 0.44
    group.current.rotation.y += delta * targetSpeed
    group.current.rotation.z = MathUtils.damp(
      group.current.rotation.z,
      reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.17) * 0.035,
      2,
      delta,
    )
    group.current.updateWorldMatrix(true, false)

    const compact = size.width < 760
    const panelWidth = compact ? size.width * 0.94 : Math.min(size.width * 0.42, 640)
    const panelHeight = compact ? size.height * 0.88 : size.height * 0.6
    const panelLeft = compact ? size.width * 0.03 : size.width - size.width * 0.05 - panelWidth
    const panelTop = compact ? size.height * 0.05 : size.height * 0.2

    // Every row is a fixed 100×18 box moved purely by transform — one
    // compositor-friendly write per row per frame, and only when it changed.
    layouts.forEach(({ sequence, start, end }) => {
      const element = rows.current[sequence.id]
      if (!element) return
      let transform: string
      let zIndex: string
      if (selected === sequence.id) {
        transform = `translate(${(panelLeft + panelWidth / 2).toFixed(2)}px, ${(panelTop + panelHeight / 2).toFixed(2)}px) rotate(0rad) scale(${(panelWidth / ROW_BASE_WIDTH).toFixed(4)}, ${(panelHeight / ROW_BASE_HEIGHT).toFixed(4)})`
        zIndex = '30'
      } else {
        projectedStart.copy(start).applyMatrix4(group.current!.matrixWorld).project(camera)
        projectedEnd.copy(end).applyMatrix4(group.current!.matrixWorld).project(camera)
        const startX = (projectedStart.x * 0.5 + 0.5) * size.width
        const startY = (-projectedStart.y * 0.5 + 0.5) * size.height
        const endX = (projectedEnd.x * 0.5 + 0.5) * size.width
        const endY = (-projectedEnd.y * 0.5 + 0.5) * size.height
        const width = Math.max(Math.hypot(endX - startX, endY - startY), 28)
        const angle = Math.atan2(endY - startY, endX - startX)
        transform = `translate(${((startX + endX) / 2).toFixed(2)}px, ${((startY + endY) / 2).toFixed(2)}px) rotate(${angle.toFixed(4)}rad) scale(${(width / ROW_BASE_WIDTH).toFixed(4)}, ${((compact ? 12 : 18) / ROW_BASE_HEIGHT).toFixed(4)})`
        zIndex = `${Math.round(12 - projectedStart.z * 4)}`
      }
      const key = transform + zIndex
      if (lastWrites.current[sequence.id] === key) return
      lastWrites.current[sequence.id] = key
      element.style.transform = transform
      element.style.zIndex = zIndex
    })
  })

  return (
    <>
      <group
        ref={group}
        position={
          compactRendering
            ? [-0.08, size.height < 720 ? -1.2 : -1.0, -1.4]
            : [-4.15, 0, 0]
        }
        scale={compactRendering ? (size.height < 720 ? 0.5 : 0.58) : 1}
        rotation={compactRendering ? [0.04, -0.5, 0] : [0.08, -0.5, -0.1]}
      >
        <HelixStructure />
        <ConnectionSockets sequences={sequences} />
        {orderedSequences.map((sequence, index) => (
          <MeshConnector
            key={sequence.id}
            sequence={sequence}
            markerIndex={markerIndices[index]}
            selected={selected === sequence.id}
            hovered={hovered === sequence.id}
            muted={selected !== null && selected !== sequence.id}
            reducedMotion={reducedMotion}
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}
      </group>
    </>
  )
}

function CameraRig({
  selected,
  reducedMotion,
}: {
  selected: SequenceId | null
  reducedMotion: boolean
}) {
  const { camera, pointer, size } = useThree()
  useFrame((_, delta) => {
    const targetZ = size.width < 700 ? 11.5 : 10.8
    const pointerX = reducedMotion || selected ? 0 : pointer.x * 0.18
    const pointerY = reducedMotion || selected ? 0 : pointer.y * 0.12
    camera.position.x = MathUtils.damp(camera.position.x, pointerX, 2.3, delta)
    camera.position.y = MathUtils.damp(camera.position.y, pointerY, 2.3, delta)
    camera.position.z = MathUtils.damp(camera.position.z, targetZ, 2.3, delta)
    camera.lookAt(0, 0, 0)
  })
  return null
}

// Everything static in the scene is memoized so a hover (which re-renders the
// helix) never reconciles the lights, re-bakes the environment map, or rebuilds
// the post-processing passes.
const Lights = memo(function Lights() {
  return (
    <>
      <color attach="background" args={['#0a0d15']} />
      <fogExp2 attach="fog" args={['#0a0d15', 0.075]} />
      <ambientLight intensity={0.38} color="#d7d5e8" />
      <directionalLight position={[5, 4, 6]} intensity={3.6} color="#fff1dc" />
      <directionalLight position={[-5, -2, 2]} intensity={2.1} color="#8ea8ff" />
      <spotLight position={[0, 7, -2]} intensity={4.2} angle={0.45} penumbra={1} color="#ffb7a7" />
    </>
  )
})

const StudioEnvironment = memo(function StudioEnvironment({ compact }: { compact: boolean }) {
  return (
    <Environment resolution={compact ? 32 : 96} environmentIntensity={0.38}>
      <group rotation={[-Math.PI / 3, 0, 0.4]}>
        <Lightformer
          form="ring"
          intensity={2.2}
          color="#d9eee8"
          scale={[5, 5, 1]}
          position={[0, 5, -3]}
        />
        <Lightformer
          form="rect"
          intensity={1.4}
          color="#517f78"
          scale={[3, 1.2, 1]}
          position={[-4, 1, 2]}
        />
        <Lightformer
          form="rect"
          intensity={1}
          color="#b68b64"
          scale={[2, 3, 1]}
          position={[4, -2, 1]}
        />
      </group>
    </Environment>
  )
})

const Effects = memo(function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur intensity={0.64} luminanceThreshold={0.58} luminanceSmoothing={0.38} />
      <Noise opacity={0.018} />
      <Vignette eskil={false} offset={0.12} darkness={0.78} />
    </EffectComposer>
  )
})

type SceneContentProps = Pick<
  SceneProps,
  'sequences' | 'selected' | 'hovered' | 'paused' | 'reducedMotion' | 'onSelect' | 'onHover'
> & { rows: RowRefs }

function SceneContent(props: SceneContentProps) {
  const compactRendering = useThree((state) => state.size.width < 760)

  return (
    <>
      <Lights />
      <MolecularHelix {...props} compactRendering={compactRendering} />
      <CameraRig selected={props.selected} reducedMotion={props.reducedMotion} />
      <StudioEnvironment compact={compactRendering} />
      {props.reducedMotion || compactRendering ? null : <Effects />}
    </>
  )
}

/**
 * Reports readiness after a few real frames, once shaders have compiled and the
 * environment has baked — the first-frame stall happens behind the placeholder.
 */
function ReadySignal({ onReady }: { onReady?: () => void }) {
  const frames = useRef(0)
  useFrame(() => {
    frames.current += 1
    if (frames.current === 4) onReady?.()
  })
  return null
}

// Long enough for an opened connector to finish damping into the panel.
const SETTLE_MS = 1600

export function HelixScene(props: SceneProps) {
  const { sequences, selected, hovered, paused, reducedMotion, onSelect, onHover, onReady } = props
  const [ready, setReady] = useState(false)
  const handleReady = useCallback(() => {
    setReady(true)
    onReady?.()
  }, [onReady])
  const rows = useRef<Record<string, HTMLDivElement | null>>({})
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState === 'visible')
  const [compactViewport, setCompactViewport] = useState(() => window.innerWidth < 760)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    const handleVisibility = () => setPageVisible(document.visibilityState === 'visible')
    const handleResize = () => setCompactViewport(window.innerWidth < 760)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('resize', handleResize, { passive: true })
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // While a panel is open the helix stops spinning; once everything has
  // damped into place, stop rendering frames that would be identical and give
  // the GPU to the panel. Any change of selection wakes it back up.
  useEffect(() => {
    setSettled(false)
    if (!paused) return
    const timer = window.setTimeout(() => setSettled(true), SETTLE_MS)
    return () => window.clearTimeout(timer)
  }, [paused, selected])

  return (
    <>
      <Canvas
        className={`molecular-canvas ${ready ? 'is-ready' : ''}`}
        // The helix is GPU-bound: on a retina desktop, 1.5x DPR costs more than
        // twice the fragments of 1x and drops frames. Render at 1x and let the
        // composer's MSAA keep the edges clean instead.
        dpr={compactViewport ? [1, 1.2] : 1}
        camera={{ position: [0, 0, 8.2], fov: 42, near: 0.1, far: 60 }}
        // The desktop composer does its own MSAA; antialiasing the default
        // framebuffer as well would pay for it twice.
        gl={{
          antialias: compactViewport || reducedMotion,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        frameloop={!pageVisible ? 'never' : settled ? 'demand' : 'always'}
        onPointerMissed={() => onHover(null)}
      >
        <Suspense fallback={null}>
          <ReadySignal onReady={handleReady} />
          <SceneContent
            rows={rows}
            sequences={sequences}
            selected={selected}
            hovered={hovered}
            paused={paused}
            reducedMotion={reducedMotion}
            onSelect={onSelect}
            onHover={onHover}
          />
        </Suspense>
      </Canvas>
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
