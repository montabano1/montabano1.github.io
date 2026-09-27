import type { CSSProperties } from 'react'
import { sequences, type Category, type CategoryId } from '../data/resume'

const BASE_COLORS = ['#62e6d2', '#ffb15c', '#ff6474', '#a7d957']

/** Splits a line into letters that assemble on load; `glint` adds the traveling base-pair color wave. */
function Letters({ text, offset, glint }: { text: string; offset: number; glint?: boolean }) {
  return (
    <span className={`hero-line ${glint ? 'is-glint' : ''}`} aria-hidden="true">
      {Array.from(text).map((letter, index) => (
        <span
          key={index}
          className="hero-letter"
          style={{
            '--i': offset + index,
            '--base': BASE_COLORS[(offset + index) % BASE_COLORS.length],
          } as CSSProperties}
        >
          {letter === ' ' ? '\u00a0' : letter}
        </span>
      ))}
    </span>
  )
}

function HelixBadge() {
  // Each SVG sits in a div that carries the animation: Chrome composites a
  // transform on a div, but re-rasterizes an animated <svg> every frame.
  return (
    <div className="helix-badge" aria-hidden="true">
      <div className="helix-badge-ring">
        <svg viewBox="0 0 120 120">
          <defs>
            <path id="badge-ring" d="M60 60m-45 0a45 45 0 1 1 90 0a45 45 0 1 1 -90 0" />
          </defs>
          <text>
            <textPath href="#badge-ring" startOffset="0">
              cameras ✦ models ✦ product ✦ shipped end to end ✦
            </textPath>
          </text>
        </svg>
      </div>
      <div className="helix-badge-core">
        <svg viewBox="0 0 40 40">
          <path d="M13 6c14 7 14 21 0 28" />
          <path d="M27 6c-14 7 -14 21 0 28" />
          <path className="rung" d="M15 12h10M14 20h12M15 28h10" />
        </svg>
      </div>
    </div>
  )
}

function CategoryGlyph({ id }: { id: CategoryId }) {
  switch (id) {
    case 'experience':
      return (
        <svg className="glyph glyph-experience" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M6 24h20" />
          <rect x="7" y="17" width="5" height="7" rx="1.5" />
          <rect x="14" y="12" width="5" height="12" rx="1.5" />
          <rect x="21" y="6" width="5" height="18" rx="1.5" />
        </svg>
      )
    case 'work':
      return (
        <svg className="glyph glyph-work" viewBox="0 0 32 32" aria-hidden="true">
          <path className="arc" d="M5 25Q12 3 20 20Q23 12 27 16" />
          <circle className="ball" r="2.6" />
          <path d="M4 27h24" />
        </svg>
      )
    case 'craft':
      return (
        <svg className="glyph glyph-craft" viewBox="0 0 32 32" aria-hidden="true">
          <ellipse cx="16" cy="16" rx="12" ry="4.6" />
          <ellipse cx="16" cy="16" rx="12" ry="4.6" transform="rotate(60 16 16)" />
          <ellipse cx="16" cy="16" rx="12" ry="4.6" transform="rotate(120 16 16)" />
          <circle className="core" cx="16" cy="16" r="2.4" />
        </svg>
      )
    case 'contact':
      return (
        <svg className="glyph glyph-contact" viewBox="0 0 32 32" aria-hidden="true">
          <circle className="core" cx="9" cy="23" r="2.4" />
          <path className="wave w1" d="M9 16a7 7 0 0 1 7 7" />
          <path className="wave w2" d="M9 10a13 13 0 0 1 13 13" />
          <path className="wave w3" d="M9 4a19 19 0 0 1 19 19" />
        </svg>
      )
  }
}

type InterfaceProps = {
  categories: Category[]
  selectedCategory: CategoryId | null
  hoveredCategory: CategoryId | null
  loaded: boolean
  onSelect: (id: CategoryId) => void
}

export function Interface({
  categories,
  selectedCategory,
  hoveredCategory,
  loaded,
  onSelect,
}: InterfaceProps) {
  return (
    <div
      className={`interface ${loaded ? 'is-loaded' : ''} ${selectedCategory ? 'has-selection' : ''}`}
      inert={selectedCategory ? true : undefined}
      aria-hidden={selectedCategory ? true : undefined}
    >
      <main
        className="hero-copy"
        aria-hidden={selectedCategory ? 'true' : undefined}
      >
        <a
          className="availability"
          href="mailto:montabano1@gmail.com?subject=Forward-deployed%20engineering%20role"
        >
          <i aria-hidden="true" />
          Open to forward-deployed engineering roles
        </a>
        <p className="hero-kicker">Michael Montalbano · Principal engineer</p>
        <HelixBadge />
        <h1 aria-label="This is what I’m made of.">
          <Letters text="This is what" offset={0} />
          <em>
            <Letters text="I’m made of." offset={12} glint />
          </em>
        </h1>
        <p className="hero-intro">
          I take systems from ambiguous problem to production —{' '}
          <a href="#work-paddlescreens">court cameras and the vision models that call the lines</a>,{' '}
          <a href="#work-beleeg">an AI copilot that runs sports leagues but asks before it acts</a>,
          and <a href="#work-recruitplan">the recruiting model a top girls’ lacrosse club runs on</a>.
          Principal Engineer at Capital One; previously shipped Orion AR glasses at Meta.
        </p>
        <a className="resume-button" href="/resume.pdf" target="_blank" rel="noreferrer">
          <span className="resume-document" aria-hidden="true"><i /><i /><i /></span>
          <span>
            View résumé
            <small>Open the full PDF</small>
          </span>
          <b aria-hidden="true">↗</b>
        </a>
        <nav className="hero-links" aria-label="External links">
          <a href="https://github.com/montabano1" target="_blank" rel="noreferrer">
            GitHub <span aria-hidden="true">↗</span>
          </a>
          <a
            href="https://www.linkedin.com/in/michael-montalbano-47832114/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn <span aria-hidden="true">↗</span>
          </a>
          <a href="mailto:montabano1@gmail.com">Email <span aria-hidden="true">↗</span></a>
        </nav>
      </main>

      <nav className="sequence-nav" aria-label="Explore résumé sequences">
        <p className="nav-label">Take a spin through what I’m made of</p>
        <ol>
          {categories.map((category) => {
            const active = selectedCategory === category.id
            const highlighted = hoveredCategory === category.id
            const count = sequences.filter(
              (sequence) => sequence.categoryId === category.id,
            ).length
            return (
              <li key={category.id}>
                <button
                  type="button"
                  className={active ? 'is-active' : highlighted ? 'is-highlighted' : ''}
                  style={{ '--sequence-color': category.color } as CSSProperties}
                  onClick={() => onSelect(category.id)}
                  aria-pressed={active}
                >
                  <CategoryGlyph id={category.id} />
                  <span>
                    {count} {category.noun}
                  </span>
                  <strong>{category.label}</strong>
                  <b aria-hidden="true">↗</b>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>
    </div>
  )
}
