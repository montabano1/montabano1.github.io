import { useEffect, useRef, useState, type ReactNode } from 'react'

export type FigureKind =
  | 'court'
  | 'timeline'
  | 'splats'
  | 'ticker'
  | 'agents'
  | 'layers'
  | 'calculus'
  | 'equation'
  | 'network'
  | 'document'
  | 'strands'
  | 'signal'
  | 'bracket'
  | 'tiers'
  | 'route'

type FigureProps = {
  kind: FigureKind
  sequenceId: string
  reducedMotion: boolean
}

const W = 520
const H = 124

/** Runs `tick` every animation frame with elapsed seconds; stops under reduced motion. */
function useFrameLoop(tick: (seconds: number) => void, enabled: boolean) {
  const tickRef = useRef(tick)
  tickRef.current = tick
  useEffect(() => {
    if (!enabled) {
      tickRef.current(1.6)
      return
    }
    let frame = 0
    const start = performance.now()
    const loop = (now: number) => {
      tickRef.current(Math.max(0, now - start) / 1000)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [enabled])
}

function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="panel-figure">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
        {children}
      </svg>
    </figure>
  )
}

/* ---------------------------------------------------------------- court */

type CourtPoint = { u: number; v: number; z: number }

// A looping rally in court coordinates: u across (0–1), v depth (0 far, 1 near), z height.
const RALLY: CourtPoint[] = [
  { u: 0.3, v: 0.94, z: 0.34 },
  { u: 0.66, v: 0.2, z: 0 },
  { u: 0.72, v: 0.04, z: 0.3 },
  { u: 0.34, v: 0.74, z: 0 },
  { u: 0.24, v: 0.96, z: 0.28 },
  { u: 0.58, v: 0.3, z: 0 },
  { u: 0.46, v: 0.05, z: 0.36 },
  { u: 0.78, v: 0.8, z: 0 },
  { u: 0.3, v: 0.94, z: 0.34 },
]
const SEGMENT_SECONDS = 0.62

function project(u: number, v: number, z = 0) {
  const halfWidth = 96 + v * 118
  const x = W / 2 + (u - 0.5) * 2 * halfWidth
  const y = 22 + v * 86 - z * (56 + v * 34)
  return { x, y }
}

function courtLine(u0: number, v0: number, u1: number, v1: number) {
  const a = project(u0, v0)
  const b = project(u1, v1)
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`
}

function CourtFigure({ reducedMotion }: { reducedMotion: boolean }) {
  const ball = useRef<SVGCircleElement>(null)
  const shadow = useRef<SVGEllipseElement>(null)
  const trail = useRef<SVGPolylineElement>(null)
  const ripple = useRef<SVGEllipseElement>(null)
  const history = useRef<string[]>([])
  const lastBounce = useRef(-1)

  useFrameLoop((seconds) => {
    const total = (RALLY.length - 1) * SEGMENT_SECONDS
    const time = seconds % total
    const index = Math.min(Math.floor(time / SEGMENT_SECONDS), RALLY.length - 2)
    const t = (time - index * SEGMENT_SECONDS) / SEGMENT_SECONDS
    const from = RALLY[index]
    const to = RALLY[index + 1]
    const apex = to.z === 0 ? 0.42 : 0.2
    const u = from.u + (to.u - from.u) * t
    const v = from.v + (to.v - from.v) * t
    const z = from.z * (1 - t) + to.z * t + 4 * apex * t * (1 - t)
    const p = project(u, v, z)
    const s = project(u, v, 0)
    const radius = 2.6 + v * 2.2
    ball.current?.setAttribute('cx', p.x.toFixed(1))
    ball.current?.setAttribute('cy', p.y.toFixed(1))
    ball.current?.setAttribute('r', radius.toFixed(2))
    shadow.current?.setAttribute('cx', s.x.toFixed(1))
    shadow.current?.setAttribute('cy', s.y.toFixed(1))
    shadow.current?.setAttribute('rx', (radius * (1.3 - z * 0.8)).toFixed(2))

    history.current.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    if (history.current.length > 26) history.current.shift()
    trail.current?.setAttribute('points', history.current.join(' '))

    // Each segment that ends on the deck produces a bounce mark.
    const bounceIndex = to.z === 0 && t > 0.97 ? index : -1
    if (bounceIndex >= 0 && bounceIndex !== lastBounce.current && ripple.current) {
      lastBounce.current = bounceIndex
      const b = project(to.u, to.v)
      ripple.current.setAttribute('cx', b.x.toFixed(1))
      ripple.current.setAttribute('cy', b.y.toFixed(1))
      ripple.current.classList.remove('is-bouncing')
      void ripple.current.getBoundingClientRect()
      ripple.current.classList.add('is-bouncing')
    }
  }, !reducedMotion)

  const outline = [project(0, 0), project(1, 0), project(1, 1), project(0, 1)]
  const cameraFar = project(0.5, -0.12)
  const cameraNear = { x: W / 2, y: H - 4 }

  return (
    <Frame label="A rally simulated in 3D: two cameras watch the court while the ball's flight and bounces are tracked">
      <defs>
        <linearGradient id="cone-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cone-near" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        className="fig-cone"
        d={`M${cameraFar.x} ${cameraFar.y}L${project(0.02, 0.62).x} ${project(0.02, 0.62).y}L${project(0.98, 0.62).x} ${project(0.98, 0.62).y}Z`}
        fill="url(#cone-far)"
      />
      <path
        className="fig-cone is-delayed"
        d={`M${cameraNear.x} ${cameraNear.y}L${project(0.04, 0.3).x} ${project(0.04, 0.3).y}L${project(0.96, 0.3).x} ${project(0.96, 0.3).y}Z`}
        fill="url(#cone-near)"
      />
      <polygon
        points={outline.map((point) => `${point.x},${point.y}`).join(' ')}
        className="fig-court"
      />
      <path
        className="fig-court-lines"
        d={[
          courtLine(0, 0.5, 1, 0.5),
          courtLine(0.5, 0.2, 0.5, 0.8),
          courtLine(0.1, 0.2, 0.9, 0.2),
          courtLine(0.1, 0.8, 0.9, 0.8),
          courtLine(0.1, 0, 0.1, 1),
          courtLine(0.9, 0, 0.9, 1),
        ].join('')}
      />
      <path className="fig-net" d={courtLine(-0.04, 0.5, 1.04, 0.5)} />
      <rect className="fig-camera" x={cameraFar.x - 7} y={cameraFar.y - 5} width="14" height="8" rx="2" />
      <rect className="fig-camera" x={cameraNear.x - 8} y={cameraNear.y - 6} width="16" height="9" rx="2" />
      <ellipse ref={ripple} className="fig-ripple" cx="-20" cy="-20" rx="9" ry="3.2" />
      <polyline ref={trail} className="fig-trail" points="" />
      <ellipse ref={shadow} className="fig-shadow" cx="-20" cy="-20" rx="3" ry="1.2" />
      <circle ref={ball} className="fig-ball" cx="-20" cy="-20" r="3" />
    </Frame>
  )
}

/* ------------------------------------------------------------- timeline */

const CAREER = [
  { id: 'experience-earthcam', label: 'EarthCam', from: 2019, to: 2020.2 },
  { id: 'experience-meta', label: 'Meta', from: 2020.3, to: 2024.6 },
  { id: 'experience-capital-one', label: 'Capital One', from: 2025, to: 2026.8 },
]

function TimelineFigure({ sequenceId }: { sequenceId: string }) {
  const start = 2018.6
  const end = 2027
  const x = (year: number) => 24 + ((year - start) / (end - start)) * (W - 48)
  return (
    <Frame label="Career timeline from 2019 to today, with this role highlighted">
      <path className="fig-axis" d={`M${x(start)} 88H${x(end)}`} />
      {[2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map((year) => (
        <g key={year}>
          <path className="fig-tick" d={`M${x(year)} 84V92`} />
          <text className="fig-caption" x={x(year)} y="108" textAnchor="middle">
            {year}
          </text>
        </g>
      ))}
      {CAREER.map((role, index) => {
        const active = role.id === sequenceId
        return (
          <g key={role.id} className={`fig-role ${active ? 'is-active' : ''}`} style={{ animationDelay: `${0.9 + index * 0.14}s` }}>
            <rect
              x={x(role.from)}
              y={active ? 46 : 58}
              width={x(role.to) - x(role.from)}
              height={active ? 22 : 12}
              rx={active ? 11 : 6}
            />
            <text className="fig-caption" x={x(role.from) + 2} y={active ? 36 : 50}>
              {role.label}
            </text>
          </g>
        )
      })}
      <circle className="fig-now" cx={x(2026.73)} cy="88" r="4" />
    </Frame>
  )
}

/* --------------------------------------------------------------- splats */

const SPLATS = Array.from({ length: 46 }, (_, index) => {
  const seed = Math.sin(index * 91.7) * 43758.5453
  const r = seed - Math.floor(seed)
  const seed2 = Math.sin(index * 12.9 + 4.1) * 23421.631
  const r2 = seed2 - Math.floor(seed2)
  return {
    x: 30 + r * (W - 60),
    y: 18 + r2 * (H - 36),
    rx: 8 + r2 * 22,
    ry: 4 + r * 9,
    angle: Math.round(r * 180),
    opacity: 0.35 + r2 * 0.4,
  }
})

function SplatsFigure() {
  return (
    <Frame label="Gaussian splats: a raw scene on the left, the compressed and validated result on the right, with a diff scanner sweeping across">
      <defs>
        <filter id="splat-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <clipPath id="splat-reveal">
          <rect className="fig-scan-clip" x="0" y="0" width={W} height={H} />
        </clipPath>
      </defs>
      <g filter="url(#splat-blur)">
        {SPLATS.map((splat, index) => (
          <ellipse
            key={index}
            className="fig-splat"
            cx={splat.x}
            cy={splat.y}
            rx={splat.rx}
            ry={splat.ry}
            opacity={splat.opacity}
            transform={`rotate(${splat.angle} ${splat.x} ${splat.y})`}
            style={{ animationDelay: `${(index % 9) * -0.4}s` }}
          />
        ))}
      </g>
      <g clipPath="url(#splat-reveal)">
        <rect x="0" y="0" width={W} height={H} className="fig-backdrop" />
        {SPLATS.map((splat, index) => (
          <rect
            key={index}
            className="fig-quantized"
            x={Math.round(splat.x / 12) * 12 - 5}
            y={Math.round(splat.y / 12) * 12 - 5}
            width="10"
            height="10"
            rx="2"
            opacity={splat.opacity + 0.25}
          />
        ))}
      </g>
      <line className="fig-scanline" x1="0" y1="4" x2="0" y2={H - 4} />
    </Frame>
  )
}

/* --------------------------------------------------------------- ticker */

function TickerFigure({ reducedMotion }: { reducedMotion: boolean }) {
  const line = useRef<SVGPolylineElement>(null)
  const markers = useRef<SVGGElement>(null)
  const points = useRef<number[]>(
    Array.from({ length: 64 }, (_, index) => 62 + Math.sin(index * 0.35) * 16 + Math.sin(index * 1.3) * 6),
  )
  const orders = useRef<{ index: number; accepted: boolean }[]>([])
  const lastStep = useRef(0)

  useFrameLoop((seconds) => {
    const step = Math.floor(seconds * 5)
    while (lastStep.current < step) {
      lastStep.current += 1
      const previous = points.current[points.current.length - 1]
      const drift = Math.sin(lastStep.current * 0.21) * 1.6 + Math.sin(lastStep.current * 2.7) * 3.4
      points.current.push(Math.max(22, Math.min(100, previous + drift + (62 - previous) * 0.06)))
      points.current.shift()
      orders.current = orders.current
        .map((order) => ({ ...order, index: order.index - 1 }))
        .filter((order) => order.index >= 0)
      if (lastStep.current % 9 === 0) {
        orders.current.push({ index: points.current.length - 1, accepted: lastStep.current % 27 !== 0 })
      }
    }
    const offset = (seconds * 5) % 1
    const spacing = (W - 40) / (points.current.length - 2)
    const coordinates = points.current
      .map((value, index) => `${(20 + (index - offset) * spacing).toFixed(1)},${value.toFixed(1)}`)
      .join(' ')
    line.current?.setAttribute('points', coordinates)
    if (markers.current) {
      markers.current.innerHTML = orders.current
        .map(({ index, accepted }) => {
          const cx = 20 + (index - offset) * spacing
          const cy = points.current[index]
          return accepted
            ? `<circle class="fig-order" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4.5"/>`
            : `<path class="fig-reject" d="M${cx - 4} ${cy - 4}l8 8m0 -8l-8 8"/>`
        })
        .join('')
    }
  }, !reducedMotion)

  return (
    <Frame label="A live price line with trade proposals: accepted orders pass the risk band, a rejected one is struck out">
      <rect className="fig-band" x="12" y="38" width={W - 24} height="48" rx="8" />
      <text className="fig-caption" x="20" y="32">risk envelope</text>
      <polyline ref={line} className="fig-price" points="" />
      <g ref={markers} />
    </Frame>
  )
}

/* --------------------------------------------------------------- agents */

const LANES = ['research', 'implement', 'review', 'test']

function AgentsFigure() {
  const gateX = 372
  return (
    <Frame label="Four parallel agent lanes feeding a single verification gate before anything ships">
      {LANES.map((lane, index) => {
        const y = 20 + index * 26
        return (
          <g key={lane}>
            <text className="fig-caption" x="14" y={y + 3.5}>{lane}</text>
            <path className="fig-lane" d={`M86 ${y}H${gateX - 10}Q${gateX} ${y} ${gateX + 6} 62`} />
            {[0, 1, 2].map((packet) => (
              <circle
                key={packet}
                className="fig-packet"
                r="3.4"
                style={{
                  offsetPath: `path('M86 ${y}H${gateX - 10}Q${gateX} ${y} ${gateX + 6} 62')`,
                  animationDelay: `${index * -0.55 + packet * -1.3}s`,
                }}
              />
            ))}
          </g>
        )
      })}
      <rect className="fig-gate" x={gateX + 4} y="12" width="8" height="100" rx="4" />
      <path className="fig-ship" d={`M${gateX + 16} 62H${W - 20}`} />
      <circle className="fig-shipped" r="4.5" style={{ offsetPath: `path('M${gateX + 16} 62H${W - 20}')` }} />
      <text className="fig-caption" x={W - 20} y="50" textAnchor="end">ship</text>
    </Frame>
  )
}

/* --------------------------------------------------------------- layers */

const STACK = ['cloud', 'systems', 'web', 'native']

function LayersFigure() {
  return (
    <Frame label="A stack of layers — native, web, systems, and cloud — floating as one system">
      {STACK.map((layer, index) => {
        const y = 10 + index * 27
        return (
          <g key={layer} className="fig-layer" style={{ animationDelay: `${index * -0.5}s` }}>
            <path d={`M${W / 2} ${y}L${W / 2 + 120} ${y + 11}L${W / 2} ${y + 22}L${W / 2 - 120} ${y + 11}Z`} />
            <text className="fig-caption" x={W / 2 + 136} y={y + 15}>{layer}</text>
          </g>
        )
      })}
    </Frame>
  )
}

/* ------------------------------------------------------------- calculus */

function CalculusFigure({ reducedMotion }: { reducedMotion: boolean }) {
  const dot = useRef<SVGCircleElement>(null)
  const tangent = useRef<SVGLineElement>(null)
  const f = (x: number) => 62 - Math.sin((x - 20) / 48) * 34
  const slope = (x: number) => -Math.cos((x - 20) / 48) * (34 / 48)
  const curve = Array.from({ length: 97 }, (_, index) => {
    const x = 20 + index * 5
    return `${index === 0 ? 'M' : 'L'}${x} ${f(x).toFixed(1)}`
  }).join('')

  useFrameLoop((seconds) => {
    const x = 20 + ((Math.sin(seconds * 0.55 - Math.PI / 2) + 1) / 2) * (W - 40)
    const y = f(x)
    const m = slope(x)
    const reach = 46 / Math.sqrt(1 + m * m)
    dot.current?.setAttribute('cx', x.toFixed(1))
    dot.current?.setAttribute('cy', y.toFixed(1))
    tangent.current?.setAttribute('x1', (x - reach).toFixed(1))
    tangent.current?.setAttribute('y1', (y - m * reach).toFixed(1))
    tangent.current?.setAttribute('x2', (x + reach).toFixed(1))
    tangent.current?.setAttribute('y2', (y + m * reach).toFixed(1))
  }, !reducedMotion)

  return (
    <Frame label="A sine curve with its tangent line sliding along it">
      <path className="fig-axis" d={`M20 62H${W - 20}`} />
      <path className="fig-curve" d={curve} pathLength={1} />
      <line ref={tangent} className="fig-tangent" />
      <circle ref={dot} className="fig-dot" r="5" />
      <text className="fig-caption fig-serif" x={W - 22} y="116" textAnchor="end">f′(x) = cos x</text>
    </Frame>
  )
}

/* ------------------------------------------------------------- equation */

function EquationFigure({ reducedMotion }: { reducedMotion: boolean }) {
  const text = 'x² + 2x + 1 = (x + 1)²'
  const [shown, setShown] = useState(reducedMotion ? text.length : 0)
  useEffect(() => {
    if (reducedMotion) return
    let count = 0
    let hold = 0
    const timer = window.setInterval(() => {
      if (count < text.length) {
        count += 1
      } else if ((hold += 1) > 14) {
        count = 0
        hold = 0
      }
      setShown(count)
    }, 120)
    return () => window.clearInterval(timer)
  }, [reducedMotion])
  return (
    <Frame label="An equation being worked out step by step">
      <text className="fig-equation" x={W / 2} y="74" textAnchor="middle">
        {text.slice(0, shown)}
        <tspan className="fig-cursor">|</tspan>
      </text>
      <path className="fig-underline" d={`M${W / 2 - 150} 92H${W / 2 + 150}`} pathLength={1} />
    </Frame>
  )
}

/* -------------------------------------------------------------- network */

const SCHOOLS = [18, 42, 66, 90, 114].map((y, index) => ({ y: y - 4, key: index }))

function NetworkFigure() {
  return (
    <Frame label="An athlete connected to candidate programs, with the strongest matches lighting up">
      {SCHOOLS.map((school, index) => (
        <path
          key={school.key}
          className="fig-link"
          d={`M110 62C240 62 260 ${school.y} ${W - 110} ${school.y}`}
          pathLength={1}
          style={{ animationDelay: `${index * 0.45}s` }}
        />
      ))}
      <circle className="fig-hub" cx="110" cy="62" r="11" />
      {SCHOOLS.map((school, index) => (
        <circle
          key={school.key}
          className="fig-node"
          cx={W - 110}
          cy={school.y}
          r="6"
          style={{ animationDelay: `${index * 0.45}s` }}
        />
      ))}
    </Frame>
  )
}

/* ------------------------------------------------------------- document */

function DocumentFigure() {
  return (
    <Frame label="A résumé page writing itself">
      <rect className="fig-page" x={W / 2 - 48} y="8" width="96" height="108" rx="8" />
      {[26, 38, 50, 62, 74, 86, 98].map((y, index) => (
        <path
          key={y}
          className="fig-writeline"
          d={`M${W / 2 - 32} ${y}H${W / 2 + (index % 3 === 0 ? 14 : 32)}`}
          pathLength={1}
          style={{ animationDelay: `${0.8 + index * 0.22}s` }}
        />
      ))}
      <circle className="fig-orbit" r="4" style={{ offsetPath: `path('M${W / 2 - 110} 62a110 46 0 1 0 220 0a110 46 0 1 0 -220 0')` }} />
    </Frame>
  )
}

/* -------------------------------------------------------------- strands */

function strandPath(phase: number, converge: boolean) {
  return Array.from({ length: 105 }, (_, index) => {
    const x = 10 + index * 4.8
    const progress = index / 104
    const amplitude = converge ? 40 * (1 - progress) + 16 * progress : 16
    const offset = converge ? (phase === 0 ? -1 : 1) * 30 * (1 - Math.min(progress * 1.6, 1)) : 0
    const y = 62 + offset + Math.sin(progress * Math.PI * 5 + phase) * amplitude * Math.min(progress * 1.6, 1)
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
  }).join('')
}

function StrandsFigure() {
  return (
    <Frame label="Two separate strands converging and twisting into one helix">
      <path className="fig-strand" d={strandPath(0, true)} pathLength={1} />
      <path className="fig-strand is-second" d={strandPath(Math.PI, true)} pathLength={1} />
    </Frame>
  )
}

/* --------------------------------------------------------------- signal */

function SignalFigure() {
  return (
    <Frame label="A signal radiating outward from a single point">
      {[0, 1, 2, 3].map((ring) => (
        <circle
          key={ring}
          className="fig-wave"
          cx={W / 2}
          cy="62"
          r="52"
          style={{ animationDelay: `${ring * 0.7}s` }}
        />
      ))}
      <path className="fig-envelope" d={`M${W / 2 - 16} 52h32v22h-32zM${W / 2 - 16} 52l16 12 16-12`} />
    </Frame>
  )
}

/* -------------------------------------------------------------- bracket */

const PROMPT = 'Seed the playoffs by standings'
const SEEDS = ['1', '8', '4', '5', '3', '6', '2', '7']

function BracketFigure({ reducedMotion }: { reducedMotion: boolean }) {
  // One tick every 90 ms: type the request, wait for the confirm, then draw
  // each round of the bracket, hold, and start over.
  const typed = PROMPT.length
  const confirmAt = typed + 6
  const rounds = [confirmAt + 4, confirmAt + 10, confirmAt + 16, confirmAt + 22]
  const cycle = rounds[3] + 30
  const [tick, setTick] = useState(reducedMotion ? rounds[3] : 0)
  useEffect(() => {
    if (reducedMotion) return
    const timer = window.setInterval(() => setTick((value) => (value + 1) % cycle), 90)
    return () => window.clearInterval(timer)
  }, [reducedMotion, cycle])

  const x = [248, 318, 388, 458]
  const leaf = (index: number) => 12 + index * 13.4
  const ys: number[][] = [SEEDS.map((_, index) => leaf(index))]
  for (let round = 1; round < 4; round += 1) {
    ys.push(ys[round - 1].filter((_, index) => index % 2 === 0).map((y, index) => (y + ys[round - 1][index * 2 + 1]) / 2))
  }

  return (
    <Frame label="The league copilot drafts a request, waits for a person to confirm it, and only then draws the playoff bracket">
      <rect className="fig-chat" x="12" y="18" width="198" height="36" rx="12" />
      <text className="fig-chat-text" x="24" y="40">
        {PROMPT.slice(0, Math.min(tick, typed))}
        {tick < typed ? <tspan className="fig-cursor">|</tspan> : null}
      </text>
      <g className={`fig-confirm ${tick >= typed ? 'is-asking' : ''} ${tick >= confirmAt ? 'is-confirmed' : ''}`}>
        <rect x="12" y="66" width="198" height="30" rx="10" />
        <text x="111" y="85" textAnchor="middle">
          {tick >= confirmAt ? '✓ Confirmed — applying' : 'Confirm before anything changes?'}
        </text>
      </g>
      {ys.slice(0, 3).map((column, round) =>
        column.map((y, index) => {
          if (index % 2) return null
          const y2 = column[index + 1]
          const mid = (y + y2) / 2
          return (
            <path
              key={`${round}-${index}`}
              className={`fig-bracket ${tick >= rounds[round + 1] ? 'is-drawn' : ''}`}
              d={`M${x[round] + 26} ${y}H${x[round] + 44}V${y2}H${x[round] + 26}M${x[round] + 44} ${mid}H${x[round + 1]}`}
              pathLength={1}
            />
          )
        }),
      )}
      {ys.map((column, round) =>
        column.map((y, index) => (
          <g key={`${round}-${index}`} className={`fig-seed ${tick >= rounds[round] ? 'is-in' : ''}`}>
            <rect x={x[round]} y={y - 5.5} width="26" height="11" rx="5.5" />
            {round === 0 ? (
              <text x={x[round] + 13} y={y + 3.4} textAnchor="middle">{SEEDS[index]}</text>
            ) : null}
          </g>
        )),
      )}
    </Frame>
  )
}

/* ---------------------------------------------------------------- tiers */

// An athlete's predicted placement: a probability for each of 12 college
// tiers, with the most likely three-tier band and the median called out.
const TIER_ODDS = [0.02, 0.05, 0.1, 0.19, 0.24, 0.18, 0.1, 0.06, 0.03, 0.015, 0.01, 0.005]

function TiersFigure() {
  const left = 44
  const step = 37
  const base = 96
  const scale = 250
  return (
    <Frame label="An athlete's predicted college placement: a probability for each of twelve tiers from top Division I to NAIA, with the most likely band highlighted">
      <rect className="fig-band-tier" x={left + step * 3 - 5} y="10" width={step * 3} height={base - 6} rx="9" />
      <text className="fig-caption fig-band-label" x={left + step * 4.5 - 5} y="24" textAnchor="middle">most likely band</text>
      {TIER_ODDS.map((odds, index) => {
        const height = odds * scale
        const inBand = index >= 3 && index <= 5
        return (
          <rect
            key={index}
            className={`fig-tier ${inBand ? 'is-band' : ''} ${index === 4 ? 'is-median' : ''}`}
            x={left + step * index}
            y={base - height}
            width={step - 10}
            height={height}
            rx="4"
            style={{ animationDelay: `${0.9 + index * 0.06}s` }}
          />
        )
      })}
      <path className="fig-axis" d={`M${left - 6} ${base}H${left + step * 12 - 4}`} />
      <text className="fig-caption" x={left} y="114">Top D1</text>
      <text className="fig-caption" x={left + step * 12 - 10} y="114" textAnchor="end">NAIA</text>
      <text className="fig-caption fig-median-label" x={left + step * 4 + 13} y="114" textAnchor="middle">median</text>
    </Frame>
  )
}

/* ---------------------------------------------------------------- route */

const STOPS = [
  { x: 70, y: 96, label: 'camera install', above: false },
  { x: 262, y: 56, label: 'league migration', above: true },
  { x: 448, y: 92, label: 'club pilot', above: false },
]
const ROUTE = 'M70 96C140 96 170 56 262 56S380 92 448 92'

function RouteFigure() {
  return (
    <Frame label="A route between three customer sites — a camera install, a league migration, and a club pilot — lighting each one up as it arrives">
      <path className="fig-route" d={ROUTE} />
      <path className="fig-route-trace" d={ROUTE} pathLength={1} />
      {STOPS.map((stop, index) => (
        <g key={stop.label} className="fig-stop" style={{ animationDelay: `${0.9 + index * 1.1}s` }}>
          <path d={`M${stop.x} ${stop.y}c-9 -11 -14 -17 -14 -24a14 14 0 0 1 28 0c0 7 -5 13 -14 24z`} />
          <circle cx={stop.x} cy={stop.y - 24} r="4.5" />
          <text className="fig-caption" x={stop.x} y={stop.above ? stop.y - 44 : stop.y + 18} textAnchor="middle">{stop.label}</text>
        </g>
      ))}
      <circle className="fig-traveler" r="5" style={{ offsetPath: `path('${ROUTE}')` }} />
    </Frame>
  )
}

export function PanelFigure({ kind, sequenceId, reducedMotion }: FigureProps) {
  switch (kind) {
    case 'court':
      return <CourtFigure reducedMotion={reducedMotion} />
    case 'timeline':
      return <TimelineFigure sequenceId={sequenceId} />
    case 'splats':
      return <SplatsFigure />
    case 'ticker':
      return <TickerFigure reducedMotion={reducedMotion} />
    case 'agents':
      return <AgentsFigure />
    case 'layers':
      return <LayersFigure />
    case 'calculus':
      return <CalculusFigure reducedMotion={reducedMotion} />
    case 'equation':
      return <EquationFigure reducedMotion={reducedMotion} />
    case 'network':
      return <NetworkFigure />
    case 'document':
      return <DocumentFigure />
    case 'strands':
      return <StrandsFigure />
    case 'signal':
      return <SignalFigure />
    case 'bracket':
      return <BracketFigure reducedMotion={reducedMotion} />
    case 'tiers':
      return <TiersFigure />
    case 'route':
      return <RouteFigure />
  }
}
