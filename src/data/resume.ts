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
    intro: 'League software with an AI copilot that does the work',
    detail:
      'Everything an amateur sports league runs on — schedules, scoring, standings, brackets, payments, and messaging — on web and mobile. Its copilot, lebrAIn, turns a sentence into finished work: email a division, rain out a night, settle a disputed score, chase unpaid dues, roll over the season. Every action is one tap to confirm, and outside assistants like Claude can run a league through the same actions over MCP.',
    tags: ['AI agents', 'MCP', 'Multi-tenant Postgres'],
    stats: [
      { value: '43', label: 'Actions lebrAIn can take' },
      { value: '21', label: 'Live questions it answers' },
      { value: '33', label: 'Sport templates' },
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
    figure: 'tiers',
    intro: 'College lacrosse recruiting, powered by real commitment data',
    detail:
      'RecruitPlan tells a high-school lacrosse player where they fit in college, and Laxachusetts — one of the top girls’ club programs in the country — runs its recruiting on it. I built the engine behind that answer: a machine-learning model trained on about 34,000 real commitments that places each athlete across 12 tiers, from top Division I to NAIA, with a probability for every tier. I also built the pipelines that refresh 588 college programs and 62,000 roster players every day, and the billing. Co-built with RecruitPlan’s founder.',
    tags: ['Machine learning', 'Data pipelines', 'Club clients'],
    stats: [
      { value: '34k', label: 'Commitments modeled' },
      { value: '588', label: 'College programs' },
      { value: '62k', label: 'Roster players, refreshed daily' },
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
      'A UIKit app that reached 10,000+ downloads in its first year: 450+ practice questions across 15 units, an adaptive ranking that recommends the next topic from accuracy and coverage, custom inline LaTeX rendering, Firebase and CoreData persistence, and Stripe subscriptions through Cloud Functions.',
    tags: ['iOS', 'Swift', 'Education'],
    stats: [
      { value: '10,000+', label: 'First-year downloads' },
      { value: '4.8★', label: 'App Store rating' },
      { value: '450+', label: 'Practice questions' },
    ],
    action: {
      label: 'View on the App Store',
      href: 'https://apps.apple.com/us/app/tutorius-math/id1544620273',
    },
  },
  {
    id: 'craft-field',
    categoryId: 'craft',
    label: 'Capabilities',
    title: 'In the field',
    color: category('craft').color,
    glow: category('craft').glow,
    figure: 'route',
    intro: 'Where the software meets the customer',
    detail:
      'PaddleScreens runs at eight clubs with no IT staff, where every camera upgrade is a site visit — so cutovers refuse to start until every camera checks in, and roll back with one flag. Beleeg’s first real league was migrated in from its old app, and its organizer’s feedback became the backlog. RecruitPlan’s club tools were built alongside Laxachusetts, one of the top girls’ lacrosse programs in the country.',
    tags: ['On-site deployment', 'Data migration', 'Customer feedback'],
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
