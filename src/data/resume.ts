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
    intro: 'Court cameras, vision models, and line calls — end to end',
    detail:
      'Industrial cameras bolted to real platform-tennis courts feed a pipeline I built end to end: on-camera detection, dual-view sync and calibration, ball tracking, pose estimation, court segmentation, shot classification, and 3D flight solving. Members scan a QR code, play, and the match is recorded, analyzed, and ready before they leave the club.',
    tags: ['Computer vision', 'Edge deployment', 'Full stack'],
    stats: [
      { value: '2', label: 'Cameras per court' },
      { value: '250+', label: 'Sessions recorded' },
      { value: '500+', label: 'Match videos' },
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
    id: 'work-catetus',
    categoryId: 'work',
    label: 'Selected work',
    title: 'Catetus',
    color: category('work').color,
    glow: category('work').glow,
    intro: 'Production infrastructure for Gaussian Splats',
    detail:
      'A Rust toolchain that compresses, validates, and ships 3D Gaussian Splat assets — standards-aligned KHR glTF and SPZ output, deterministic visual-diff quality gates, and SplatBench, an open 28-scene benchmark with a public leaderboard.',
    tags: ['Rust', '3D graphics', 'Compression'],
    action: {
      label: 'Visit catetus.com',
      href: 'https://catetus.com',
    },
  },
  {
    id: 'work-stockbot',
    categoryId: 'work',
    label: 'Selected work',
    title: 'Autonomous trading lab',
    color: category('work').color,
    glow: category('work').glow,
    intro: 'An AI analyst wrapped in deterministic risk controls',
    detail:
      'A 24/7 paper-trading system: deterministic Python ingests SEC EDGAR and market data and screens candidates, an LLM session wakes to produce forecasts and typed trade proposals, and a deterministic risk engine — never the model — validates, sizes, and submits each order. Every decision is journaled and scored against a shadow twin.',
    tags: ['Python', 'LLM orchestration', 'Risk engineering'],
  },
  {
    id: 'work-tutorius',
    categoryId: 'work',
    label: 'Selected work',
    title: 'Tutorius Math',
    color: category('work').color,
    glow: category('work').glow,
    intro: 'Premium tutoring made accessible at scale',
    detail:
      'A full-stack iOS learning app with 10,000+ first-year downloads, an AI tutor, personalized CoreData and Firestore feedback, and custom inline LaTeX rendering.',
    tags: ['iOS', 'AI tutoring', 'Education'],
    action: {
      label: 'View on the App Store',
      href: 'https://apps.apple.com/us/app/tutorius-math/id1544620273',
    },
  },
  {
    id: 'work-recruitplan',
    categoryId: 'work',
    label: 'Selected work',
    title: 'RecruitPlan',
    color: category('work').color,
    glow: category('work').glow,
    intro: 'AI-powered guidance for athletic recruiting',
    detail:
      'An all-in-one recruiting platform shaped through interviews with coaches, parents, athletes, and administrators, with an AI assistant for next steps and admission probabilities.',
    tags: ['Product research', 'AI chatbot', 'Full stack'],
    action: {
      label: 'Visit RecruitPlan',
      href: 'https://www.recruitplan.ai/',
    },
  },
  {
    id: 'craft-ai',
    categoryId: 'craft',
    label: 'Capabilities',
    title: 'AI-augmented throughput',
    color: category('craft').color,
    glow: category('craft').glow,
    intro: 'One engineer, running like a team',
    detail:
      'I orchestrate fleets of coding agents — research, implementation, and adversarial review running in parallel, with hard verification gates before anything ships. The PaddleScreens model program, the trading lab, and this site were all built that way.',
    tags: ['Claude Code', 'Agent orchestration', 'Verification'],
  },
  {
    id: 'craft-cross-platform',
    categoryId: 'craft',
    label: 'Capabilities',
    title: 'Across every layer',
    color: category('craft').color,
    glow: category('craft').glow,
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
