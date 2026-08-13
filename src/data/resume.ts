export type CategoryId = 'experience' | 'work' | 'craft' | 'contact'
export type SequenceId = string

export type Category = {
  id: CategoryId
  code: string
  label: string
  color: string
  glow: string
}

export type Sequence = {
  id: SequenceId
  categoryId: CategoryId
  code: string
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
}

export const categories: Category[] = [
  { id: 'experience', code: 'C–01', label: 'Experience', color: '#62e6d2', glow: '#24bca8' },
  { id: 'work', code: 'C–02', label: 'Selected work', color: '#ffb15c', glow: '#ef7e27' },
  { id: 'craft', code: 'C–03', label: 'Capabilities', color: '#ff6474', glow: '#df3153' },
  { id: 'contact', code: 'C–04', label: 'Contact', color: '#a7d957', glow: '#6f9e30' },
]

const category = (id: CategoryId) => categories.find((item) => item.id === id)!

export const sequences: Sequence[] = [
  {
    id: 'experience-capital-one',
    categoryId: 'experience',
    code: 'EXP–01',
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
    code: 'EXP–02',
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
    code: 'EXP–03',
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
    code: 'WRK–01',
    label: 'Selected work',
    title: 'PaddleScreens',
    color: category('work').color,
    glow: category('work').glow,
    intro: 'Computer vision analytics for platform tennis',
    detail:
      'A full-stack web and mobile system combining ball tracking, pose estimation, court segmentation, and QR-activated industrial cameras for match analytics, replays, and close line calls.',
    tags: ['Computer vision', 'Python', 'Swift'],
  },
  {
    id: 'work-tutorius',
    categoryId: 'work',
    code: 'WRK–02',
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
    code: 'WRK–03',
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
    code: 'CAP–01',
    label: 'Capabilities',
    title: 'Applied intelligence',
    color: category('craft').color,
    glow: category('craft').glow,
    intro: 'AI and ML that solve specific human problems',
    detail:
      'From fine-tuned tutoring and recruiting assistants to ball tracking, pose estimation, and court segmentation models.',
    tags: ['Machine learning', 'Computer vision', 'AI products'],
  },
  {
    id: 'craft-cross-platform',
    categoryId: 'craft',
    code: 'CAP–02',
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
    code: 'CAP–03',
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
    code: 'SIG–01',
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
    code: 'SIG–02',
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
    code: 'SIG–03',
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
