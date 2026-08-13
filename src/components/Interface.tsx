import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import type { Category, CategoryId } from '../data/resume'

type InterfaceProps = {
  categories: Category[]
  selectedCategory: CategoryId | null
  hoveredCategory: CategoryId | null
  loaded: boolean
  reducedMotion: boolean
  onSelect: (id: CategoryId) => void
}

export function Interface({
  categories,
  selectedCategory,
  hoveredCategory,
  loaded,
  reducedMotion,
  onSelect,
}: InterfaceProps) {
  return (
    <div
      className={`interface ${loaded ? 'is-loaded' : ''} ${selectedCategory ? 'has-selection' : ''}`}
      inert={selectedCategory ? true : undefined}
      aria-hidden={selectedCategory ? true : undefined}
    >
      <motion.main
        className="hero-copy"
        animate={{ opacity: selectedCategory ? 0.12 : 1, x: selectedCategory ? 28 : 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
        aria-hidden={selectedCategory ? 'true' : undefined}
      >
        <p className="hero-kicker">Michael Montalbano · Principal engineer</p>
        <h1>
          This is what
          <br />
          <em>I’m made of.</em>
        </h1>
        <p className="hero-intro">
          I lead account-opening iOS at Capital One. Before that, I shipped AR glasses
          and wearable experiences at Meta. These are the building blocks behind the work.
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
      </motion.main>

      <nav className="sequence-nav" aria-label="Explore résumé sequences">
        <p className="nav-label">Explore my building blocks</p>
        <ol>
          {categories.map((category) => {
            const active = selectedCategory === category.id
            const highlighted = hoveredCategory === category.id
            return (
              <li key={category.id}>
                <button
                  type="button"
                  className={active ? 'is-active' : highlighted ? 'is-highlighted' : ''}
                  style={{ '--sequence-color': category.color } as CSSProperties}
                  onClick={() => onSelect(category.id)}
                  aria-pressed={active}
                >
                  <i aria-hidden="true" />
                  <span>{category.code}</span>
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
