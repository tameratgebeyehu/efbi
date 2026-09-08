export type Program = {
  slug: string
  title: string
  shortTitle: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  duration: string
  description: string
  outcome: string
  accent: 'green' | 'gold' | 'blue' | 'red'
}

export const programs: Program[] = [
  {
    slug: 'artificial-intelligence',
    title: 'Artificial Intelligence',
    shortTitle: 'AI',
    level: 'Advanced',
    duration: '8 weeks',
    description: 'Machine learning, neural networks, computer vision, and responsible AI for real problems.',
    outcome: 'Prototype an AI-supported solution and explain its limits, risks, and evidence.',
    accent: 'green',
  },
  {
    slug: 'ai-assisted-app-development',
    title: 'AI-Assisted App Development',
    shortTitle: 'AI + App',
    level: 'Intermediate',
    duration: '6 weeks',
    description: 'Build useful applications with modern development workflows and AI-assisted tools.',
    outcome: 'Ship a documented app prototype that addresses a school or community need.',
    accent: 'gold',
  },
  {
    slug: 'web-development',
    title: 'Web Development',
    shortTitle: 'Web',
    level: 'Intermediate',
    duration: '10 weeks',
    description: 'HTML, CSS, JavaScript, responsive design, accessibility, and modern frontend practice.',
    outcome: 'Publish a responsive, accessible website backed by a clear project brief.',
    accent: 'blue',
  },
  {
    slug: 'mobile-app-development',
    title: 'Mobile App Development',
    shortTitle: 'Mobile',
    level: 'Intermediate',
    duration: '8 weeks',
    description: 'Create cross-platform mobile experiences with thoughtful interface and product decisions.',
    outcome: 'Design, test, and demonstrate a focused mobile application prototype.',
    accent: 'red',
  },
  {
    slug: 'programming-foundations',
    title: 'Programming Foundations',
    shortTitle: 'Code',
    level: 'Beginner',
    duration: '6 weeks',
    description: 'Logic, data structures, algorithms, and problem-solving with Python and JavaScript.',
    outcome: 'Build small programs confidently and explain how each part works.',
    accent: 'green',
  },
  {
    slug: 'entrepreneurship',
    title: 'Entrepreneurship',
    shortTitle: 'Venture',
    level: 'Beginner',
    duration: '6 weeks',
    description: 'Turn technology projects into credible ideas through research, models, and pitching.',
    outcome: 'Present a tested problem statement, lean model, and evidence-based pitch.',
    accent: 'gold',
  },
  {
    slug: 'leadership-development',
    title: 'Leadership Development',
    shortTitle: 'Lead',
    level: 'Beginner',
    duration: '4 weeks',
    description: 'Communication, team stewardship, ethical decisions, and community impact.',
    outcome: 'Lead a small team initiative and reflect on decisions, outcomes, and growth.',
    accent: 'blue',
  },
  {
    slug: 'career-readiness',
    title: 'Career Readiness',
    shortTitle: 'Career',
    level: 'Beginner',
    duration: '4 weeks',
    description: 'Portfolio building, CV writing, interviews, GitHub, and university applications.',
    outcome: 'Leave with a stronger portfolio, application materials, and action plan.',
    accent: 'red',
  },
]

export const values = [
  { number: '01', title: 'Innovation', description: 'We use creative thinking and emerging technology to solve meaningful problems.' },
  { number: '02', title: 'Leadership', description: 'We lead with integrity, accountability, initiative, and service to community.' },
  { number: '03', title: 'Excellence', description: 'We set a high bar for learning, teaching, evidence, and the work we publish.' },
  { number: '04', title: 'Collaboration', description: 'We grow through peer learning, open exchange, mentorship, and shared effort.' },
  { number: '05', title: 'Integrity', description: 'We are honest about our progress, protect learners, and earn trust through action.' },
  { number: '06', title: 'Lifelong Learning', description: 'We stay curious, practice consistently, and adapt as technology and society change.' },
]

export const methodology = [
  { number: '01', title: 'Learn', description: 'Build a clear foundation through focused lessons, examples, notes, and reflection.' },
  { number: '02', title: 'Practice', description: 'Apply each idea in guided exercises designed for confidence, not memorization.' },
  { number: '03', title: 'Build', description: 'Create a practical project connected to an Ethiopian school or community need.' },
  { number: '04', title: 'Lead', description: 'Present the work, receive feedback, document learning, and help others move forward.' },
]

export const buildPillars = [
  {
    number: '01',
    title: 'Video Lessons & Media Production',
    description: 'Planning, recording, editing, captioning, and packaging clear lessons for mobile and low-bandwidth learning.',
  },
  {
    number: '02',
    title: 'EFBI Web Platform & Learning Portal',
    description: 'Building the course catalogue, student portal, progress tracking, assessments, and certificate verification experience.',
  },
  {
    number: '03',
    title: 'Identity & Design System',
    description: 'Creating a consistent Ethiopian-rooted identity, accessible interfaces, reusable components, and trustworthy communication.',
  },
  {
    number: '04',
    title: 'Practical Learning Pathways',
    description: 'Turning broad subjects into sequenced lessons, applied tasks, portfolio projects, and measurable outcomes.',
  },
  {
    number: '05',
    title: 'Mentorship & Workshops Roadmap',
    description: 'Preparing future mentorship, student workshops, peer hubs, project reviews, and community learning opportunities.',
  },
]

export const curriculum = [
  { number: '01', title: 'Understanding artificial intelligence', detail: 'Learn what AI is, where it appears in daily life, and how to evaluate its limits.' },
  { number: '02', title: 'Prompting with purpose', detail: 'Practice asking clear questions, checking results, and improving weak answers.' },
  { number: '03', title: 'Responsible use', detail: 'Explore privacy, misinformation, bias, and when human judgment must lead.' },
  { number: '04', title: 'Build an Ethiopian solution', detail: 'Turn a local challenge into a small, documented project you can share.' },
]

export const blogPosts = [
  {
    category: 'Scholarships',
    title: 'How a Strong Project Portfolio Can Support Scholarship Applications',
    excerpt: 'A practical guide to documenting initiative, community impact, technical growth, and honest evidence in your application story.',
    status: 'Editorial draft',
  },
  {
    category: 'Artificial Intelligence',
    title: 'Getting Started with Machine Learning: A Student Guide',
    excerpt: 'A plain-language introduction to models, data, evaluation, and responsible experimentation for new learners.',
    status: 'Planned article',
  },
  {
    category: 'Coding',
    title: 'From an Idea to a Useful First Prototype',
    excerpt: 'How to narrow a problem, choose a small first version, test it with people, and improve through evidence.',
    status: 'Planned article',
  },
]
