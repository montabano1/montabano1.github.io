/*
 * Shared behavior for the static case-study pages: reading progress, scroll
 * rails that light each stage as it passes, and one-shot reveals (count-ups
 * and anything marked to animate in once it scrolls into view).
 */

export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const SVG_NS = 'http://www.w3.org/2000/svg'

/** Create an SVG element with attributes, optionally appending it to a parent. */
export function el(tag: string, attrs: Record<string, string | number>, parent?: Element) {
  const node = document.createElementNS(SVG_NS, tag)
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value))
  parent?.appendChild(node)
  return node
}

function countUp(node: HTMLElement) {
  const target = Number(node.dataset.count)
  const suffix = node.dataset.suffix ?? ''
  if (reduced) return
  const start = performance.now()
  const tick = (now: number) => {
    const t = Math.min((now - start) / 1400, 1)
    node.textContent = Math.round(target * (1 - Math.pow(1 - t, 4))) + suffix
    if (t < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

export function initCaseStudy() {
  const bar = document.querySelector<HTMLElement>('.top-bar')
  const rails = [...document.querySelectorAll<HTMLElement>('.pipeline')].map((pipeline) => ({
    rail: pipeline.querySelector<HTMLElement>('.rail'),
    stages: [...pipeline.querySelectorAll<HTMLElement>('.pipe-stage')],
  }))

  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight
    bar?.style.setProperty('--progress', max > 0 ? (scrollY / max).toFixed(4) : '0')
    // Each rail fills to the reading line and lights the stages it has passed.
    const line = innerHeight * 0.62
    for (const { rail, stages } of rails) {
      if (!rail) continue
      const box = rail.getBoundingClientRect()
      rail.style.setProperty('--fill', Math.min(Math.max((line - box.top) / box.height, 0), 1).toFixed(4))
      for (const stage of stages) stage.classList.toggle('is-lit', stage.getBoundingClientRect().top + 30 < line)
    }
  }
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('resize', onScroll, { passive: true })
  onScroll()

  const reveal = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        reveal.unobserve(entry.target)
        const node = entry.target as HTMLElement
        if (node.dataset.count) countUp(node)
        else node.classList.add('is-in')
      }
    },
    { threshold: 0.45 },
  )
  document.querySelectorAll('[data-count], [data-reveal], .patch, .bars').forEach((node) => reveal.observe(node))
}
