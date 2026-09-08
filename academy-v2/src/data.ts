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
    description: 'Learn how AI works and use it responsibly to solve real problems.',
    outcome: 'Build a small AI-supported solution and explain how it works.',
    accent: 'green',
  },
  {
    slug: 'ai-assisted-app-development',
    title: 'AI-Assisted App Development',
    shortTitle: 'AI + App',
    level: 'Intermediate',
    duration: '6 weeks',
    description: 'Use AI tools to plan and build useful apps faster.',
    outcome: 'Create an app prototype for a school or community need.',
    accent: 'gold',
  },
  {
    slug: 'web-development',
    title: 'Web Development',
    shortTitle: 'Web',
    level: 'Intermediate',
    duration: '10 weeks',
    description: 'Build responsive websites with HTML, CSS, JavaScript, and React.',
    outcome: 'Publish a responsive website and explain your design choices.',
    accent: 'blue',
  },
  {
    slug: 'mobile-app-development',
    title: 'Mobile App Development',
    shortTitle: 'Mobile',
    level: 'Intermediate',
    duration: '8 weeks',
    description: 'Design and build apps that work across Android and iOS.',
    outcome: 'Test and present a focused mobile app prototype.',
    accent: 'red',
  },
  {
    slug: 'programming-foundations',
    title: 'Programming Foundations',
    shortTitle: 'Code',
    level: 'Beginner',
    duration: '6 weeks',
    description: 'Learn programming logic and solve problems with Python and JavaScript.',
    outcome: 'Build small programs and explain how they work.',
    accent: 'green',
  },
  {
    slug: 'entrepreneurship',
    title: 'Entrepreneurship',
    shortTitle: 'Venture',
    level: 'Beginner',
    duration: '6 weeks',
    description: 'Turn a useful idea into a simple plan, model, and pitch.',
    outcome: 'Present a clear problem, solution, and plan.',
    accent: 'gold',
  },
  {
    slug: 'leadership-development',
    title: 'Leadership Development',
    shortTitle: 'Lead',
    level: 'Beginner',
    duration: '4 weeks',
    description: 'Practice communication, teamwork, decision-making, and community leadership.',
    outcome: 'Lead a small team project and reflect on what you learned.',
    accent: 'blue',
  },
  {
    slug: 'career-readiness',
    title: 'Career Readiness',
    shortTitle: 'Career',
    level: 'Beginner',
    duration: '4 weeks',
    description: 'Build your portfolio, CV, interview skills, and application plan.',
    outcome: 'Finish with stronger application materials and a clear next step.',
    accent: 'red',
  },
]

export const values = [
  { number: '01', title: 'Innovation', description: 'We try new ideas and use technology to solve real problems.' },
  { number: '02', title: 'Leadership', description: 'We take responsibility and use our skills to help others.' },
  { number: '03', title: 'Excellence', description: 'We care about doing thoughtful, high-quality work.' },
  { number: '04', title: 'Collaboration', description: 'We learn faster when we share, listen, and build together.' },
  { number: '05', title: 'Integrity', description: 'We are honest, protect our learners, and keep our promises.' },
  { number: '06', title: 'Lifelong Learning', description: 'We stay curious and keep learning as the world changes.' },
]

export const methodology = [
  { number: '01', title: 'Learn', description: 'Understand the idea through short lessons and clear examples.' },
  { number: '02', title: 'Practice', description: 'Try the idea in small, guided exercises.' },
  { number: '03', title: 'Build', description: 'Turn your skills into a useful project.' },
  { number: '04', title: 'Lead', description: 'Share your work, learn from feedback, and help others.' },
]

export const buildPillars = [
  {
    number: '01',
    title: 'Video Lessons & Media Production',
    description: 'Creating clear video lessons, captions, notes, and low-bandwidth options.',
  },
  {
    number: '02',
    title: 'EFBI Web Platform & Learning Portal',
    description: 'Building courses, student accounts, progress tracking, and certificate verification.',
  },
  {
    number: '03',
    title: 'Identity & Design System',
    description: 'Creating a clear, accessible design that feels true to EFBI.',
  },
  {
    number: '04',
    title: 'Practical Learning Pathways',
    description: 'Turning big subjects into short lessons, practical tasks, and finished projects.',
  },
  {
    number: '05',
    title: 'Mentorship & Workshops Roadmap',
    description: 'Planning mentorship, workshops, peer learning, and project feedback.',
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
