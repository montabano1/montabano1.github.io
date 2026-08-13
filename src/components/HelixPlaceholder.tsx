const WIDTH = 200
const HEIGHT = 700
const AMPLITUDE = 62
const TURNS = 3.2
const STEPS = 96
const RUNG_COLORS = ['#62e6d2', '#ffb15c', '#ff6474', '#a7d957']

function strandPath(phase: number) {
  const commands: string[] = []
  for (let step = 0; step <= STEPS; step += 1) {
    const y = (step / STEPS) * HEIGHT
    const angle = (step / STEPS) * TURNS * Math.PI * 2 + phase
    const x = WIDTH / 2 + Math.sin(angle) * AMPLITUDE
    commands.push(`${step === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return commands.join(' ')
}

const rungs = (() => {
  const items: { y: number; xa: number; xb: number; color: string }[] = []
  let colorIndex = 0
  for (let step = 4; step < STEPS; step += 6) {
    const y = (step / STEPS) * HEIGHT
    const angle = (step / STEPS) * TURNS * Math.PI * 2
    const offset = Math.sin(angle) * AMPLITUDE
    if (Math.abs(offset) < AMPLITUDE * 0.4) continue
    items.push({
      y,
      xa: WIDTH / 2 + offset,
      xb: WIDTH / 2 - offset,
      color: RUNG_COLORS[colorIndex % RUNG_COLORS.length],
    })
    colorIndex += 1
  }
  return items
})()

export function HelixPlaceholder() {
  return (
    <div className="helix-placeholder" aria-hidden="true">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet">
        {rungs.map((rung) => (
          <line
            key={rung.y}
            x1={rung.xa}
            y1={rung.y}
            x2={rung.xb}
            y2={rung.y}
            stroke={rung.color}
            strokeWidth="4.5"
            strokeLinecap="round"
            opacity="0.55"
          />
        ))}
        <path d={strandPath(0)} fill="none" stroke="#aeb9b4" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
        <path d={strandPath(Math.PI)} fill="none" stroke="#7f8e89" strokeWidth="5" strokeLinecap="round" opacity="0.5" />
      </svg>
    </div>
  )
}
