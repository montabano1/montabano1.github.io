import type { FigureKind } from '../components/PanelFigure'

export type CategoryId = 'experience' | 'work' | 'craft' | 'contact'
export type SequenceId = string

export type Category = {
  id: CategoryId
  noun: string
  label: string
  color: string
  glow: string
}

export type Sequence = {
  id: SequenceId
  categoryId: CategoryId
  label: string
  title: string
  color: string
  glow: string
  figure?: FigureKind
  intro: string
  detail: string
  tags: string[]
  action?: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
  stats?: {
    value: string
    label: string
  }[]
}

export const categories: Category[] = [
  { id: 'experience', noun: 'chapters', label: 'Experience', color: '#62e6d2', glow: '#24bca8' },
  { id: 'work', noun: 'builds', label: 'Selected work', color: '#ffb15c', glow: '#ef7e27' },
  { id: 'craft', noun: 'superpowers', label: 'Capabilities', color: '#ff6474', glow: '#df3153' },
  { id: 'contact', noun: 'ways in', label: 'Contact', color: '#a7d957', glow: '#6f9e30' },
]

const category = (id: CategoryId) => categories.find((item) => item.id === id)!

export const sequences: Sequence[] = [
  {
    id: 'experience-capital-one',
    categoryId: 'experience',
    label: 'Experience',
    title: 'Leading account opening',
    color: category('experience').color,
    glow: category('experience').glow,
    figure: 'timeline',
    intro: 'Principal Engineer · Capital One · 2025–Present',
    detail:
      'Leading the Account Opening iOS engineering team and recognized with a “Top Dog” award for championing AI and collaboration across engineering teams.',
    tags: ['iOS leadership', 'Applied AI', 'Cross-team influence'],
  },
  {
    id: 'experience-meta',
    categoryId: 'experience',
    label: 'Experience',
    title: 'Shipping the future',
    color: category('experience').color,
    glow: category('experience').glow,
    figure: 'timeline',
    intro: 'E5 Software Engineer · Meta · 2020–2024',
    detail:
      'Built and shipped the Orion AR glasses prototype, integrated Ray-Ban Meta and other wearables with Meta’s iOS apps for peer-to-peer video calling, and led the Instagram iOS smartwatch team.',
    tags: ['AR & wearables', 'C++', 'React Native'],
  },
  {
    id: 'experience-earthcam',
    categoryId: 'experience',
    label: 'Experience',
    title: 'Reliability in production',
    color: category('experience').color,
    glow: category('experience').glow,
    figure: 'timeline',
    intro: 'Senior iOS Developer / Project Manager · EarthCam · 2019–2020',
    detail:
      'Oversaw development of four live-production iOS apps while reducing crash frequency from 4.8% to 0.7% of users.',
    tags: ['Swift', 'Objective-C', 'Crash reduction'],
  },
  {
    id: 'work-paddlescreens',
    categoryId: 'work',
    label: 'Selected work',
    title: 'PaddleScreens',
    color: category('work').color,
    glow: category('work').glow,
    figure: 'court',
    intro: 'Court cameras, vision models, and line calls — running at real clubs',
    detail:
      'Pairs of industrial cameras on platform-tennis courts at eight clubs, each running a recorder I wrote in C that lives on the camera itself. Behind them: dual-view sync and calibration, ball tracking, pose, court segmentation, shot classification, and 3D flight solving. Members scan a QR code, play, and the match is recorded, analyzed, and ready before they leave the club.',
    tags: ['Computer vision', 'Edge deployment', 'Operations'],
    stats: [
      { value: '8', label: 'Clubs' },
      { value: '900+', label: 'Match videos' },
      { value: '2', label: 'Cameras per court' },
    ],
    action: {
      label: 'Read the case study',
      href: '/paddlescreens/',
    },
    secondaryAction: {
      label: 'Try the live demo',
      href: 'https://www.paddlescreens.com/demo',
    },
  },
  {
    id: 'work-beleeg',
    categoryId: 'work',
    label: 'Selected work',
    title: 'Beleeg',
    color: category('work').color,
    glow: category('work').glow,
    figure: 'bracket',
    intro: 'League software with an AI copilot that asks before it acts',
    detail:
      'Everything an amateur sports league runs on — schedules, scoring, standings, brackets, payments, and messaging — on web and mobile. Its copilot, lebrAIn, can take 43 real actions, but every write is prepared, previewed, and applied only after a person confirms. The same action registry is exposed as an MCP server, so outside assistants run a league under the same rules.',
    tags: ['AI agents', 'MCP', 'Multi-tenant Postgres'],
    stats: [
      { value: '43', label: 'Confirm-gated AI actions' },
      { value: '400+', label: 'Playwright tests' },
      { value: '832', label: 'Commits in four months' },
    ],
    action: {
      label: 'Read the case study',
      href: '/beleeg/',
    },
    secondaryAction: {
      label: 'Visit beleeg.com',
      href: 'https://beleeg.com',
    },
  },
  {
    id: 'work-recruitplan',
    categoryId: 'work',
    label: 'Selected work',
    title: 'RecruitPlan',
    color: category('work').color,
    glow: category('work').glow,
    figure: 'calibration',
    intro: 'College lacrosse recruiting, built on real commitment data',
    detail:
      'Co-built with RecruitPlan’s founder. I built the prediction model — a calibrated classifier trained on about 34,000 real commitments that places an athlete on a 12-tier D1-to-NAIA scale. It replaced a formula that claimed 99% confidence and was right 54–57% of the time; the new one says 62–72% and hits 64–75%. I also built the daily scrapers behind 588 college pages, and the billing.',
    tags: ['Calibrated ML', 'Data pipelines', 'Full stack'],
    stats: [
      { value: '34k', label: 'Commitments modeled' },
      { value: '588', label: 'College programs' },
      { value: '62k', label: 'Roster players scraped' },
    ],
    action: {
      label: 'Visit recruitplan.com',
      href: 'https://www.recruitplan.com',
    },
  },
  {
    id: 'work-tutorius',
    categoryId: 'work',
    label: 'Selected work',
    title: 'Tutorius Math',
    color: category('work').color,
    glow: category('work').glow,
    figure: 'equation',
    intro: 'SAT and ACT math prep on iOS',
    detail:
      'A UIKit app with 450+ practice questions across 15 units, an adaptive ranking that recommends the next topic from accuracy and coverage, custom inline LaTeX rendering, Firebase and CoreData persistence, and Stripe subscriptions through Cloud Functions.',
    tags: ['iOS', 'Swift', 'Education'],
    stats: [
      { value: '4.8★', label: 'App Store rating' },
      { value: '450+', label: 'Practice questions' },
    ],
    action: {
      label: 'View on the App Store',
      href: 'https://apps.apple.com/us/app/tutorius-math/id1544620273',
    },
  },
  {
    id: 'craft-ai',
    categoryId: 'craft',
    label: 'Capabilities',
    title: 'AI-augmented throughput',
    color: category('craft').color,
    glow: category('craft').glow,
    figure: 'agents',
    intro: 'One engineer, running like a team',
    detail:
      'I orchestrate fleets of coding agents — research, implementation, and adversarial review running in parallel, with hard verification gates before anything ships. Beleeg — 832 commits in four months — the PaddleScreens model program, and this site were all built that way.',
    tags: ['Claude Code', 'Agent orchestration', 'Verification'],
  },
  {
    id: 'craft-cross-platform',
    categoryId: 'craft',
    label: 'Capabilities',
    title: 'Across every layer',
    color: category('craft').color,
    glow: category('craft').glow,
    figure: 'layers',
    intro: 'Native, web, systems, and cloud',
    detail:
      'A cross-platform toolkit spanning C++, Kotlin, Swift, Objective-C, React Native, TypeScript, Node, Python, PostgreSQL, and AWS.',
    tags: ['Native', 'Full stack', 'Cloud'],
  },
  {
    id: 'craft-teaching',
    categoryId: 'craft',
    label: 'Capabilities',
    title: 'Math meets mentorship',
    color: category('craft').color,
    glow: category('craft').glow,
    figure: 'calculus',
    intro: 'Professor, technical lead, lifelong learner',
    detail:
      'Taught differential equations and multivariable calculus, then designed a placement algorithm that reduced initial math-class dropouts by 17%.',
    tags: ['Leadership', 'Mathematics', 'Teaching'],
  },
  {
    id: 'contact-resume',
    categoryId: 'contact',
    label: 'Contact',
    title: 'The full picture',
    color: category('contact').color,
    glow: category('contact').glow,
    figure: 'document',
    intro: 'Experience, education, and technical range',
    detail:
      'Mathematics at Carnegie Mellon, Math Education at Columbia, and a career building products from classrooms to AR glasses.',
    tags: ['Carnegie Mellon', 'Columbia', 'New York'],
    action: {
      label: 'View résumé',
      href: '/resume.pdf',
    },
  },
  {
    id: 'contact-collaborate',
    categoryId: 'contact',
    label: 'Contact',
    title: 'Build together',
    color: category('contact').color,
    glow: category('contact').glow,
    figure: 'strands',
    intro: 'The best work starts with a specific hard problem',
    detail:
      'Tell me what you are trying to make, what makes it difficult, and why it matters. That is enough to begin.',
    tags: ['Collaboration', 'Prototyping', 'Engineering'],
  },
  {
    id: 'contact-signal',
    categoryId: 'contact',
    label: 'Contact',
    title: 'Send a signal',
    color: category('contact').color,
    glow: category('contact').glow,
    figure: 'signal',
    intro: 'Direct is good',
    detail:
      'Email is the fastest way to reach me. LinkedIn and GitHub are available in the persistent navigation.',
    tags: ['Email', 'LinkedIn', 'GitHub'],
    action: {
      label: 'Send a signal',
      href: 'mailto:montabano1@gmail.com',
    },
  },
]
