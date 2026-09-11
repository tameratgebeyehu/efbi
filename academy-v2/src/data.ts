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

export type KnowledgeCheckQuestion = {
  id: string
  prompt: string
  options: string[]
  correctOption: number
  explanation: string
}

export type CourseLesson = {
  number: string
  slug: string
  title: string
  detail: string
  duration: string
  objectives: string[]
  sections: Array<{ heading: string; paragraphs: string[] }>
  knowledgeCheck: KnowledgeCheckQuestion[]
}

export const curriculum: CourseLesson[] = [
  {
    number: '01',
    slug: 'understanding-ai',
    title: 'Understanding artificial intelligence',
    detail: 'Learn what AI is, where it appears in daily life, and where its limits begin.',
    duration: '8 min',
    objectives: [
      'Explain AI in simple language.',
      'Recognize AI in tools you already use.',
      'Check an AI result before you trust or share it.',
    ],
    sections: [
      {
        heading: 'What is artificial intelligence?',
        paragraphs: [
          'Artificial intelligence is technology that learns patterns from examples. It can use those patterns to predict, classify, recommend, or create something new.',
          'AI does not understand the world in the same way a person does. It produces an answer from patterns in its training data and the information you give it.',
        ],
      },
      {
        heading: 'Where do we meet AI?',
        paragraphs: [
          'You may already use AI when a phone suggests the next word, a map estimates travel time, an email service filters spam, or an app recommends a video.',
          'In Ethiopia, students and builders can use AI to explore ideas, translate an early draft, organize information, or prototype a local solution. The useful question is not only “Can AI do this?” It is also “Should I use it here, and how will I check the result?”',
        ],
      },
      {
        heading: 'Why can AI be wrong?',
        paragraphs: [
          'An AI system can repeat mistakes or bias from its data. It may also invent a confident answer when it does not have enough reliable information.',
          'Always check important claims with trusted sources. For schoolwork, explain what you used AI for and follow your teacher’s rules. Never enter passwords, private documents, health details, or another person’s personal information into an AI tool.',
        ],
      },
      {
        heading: 'Use judgment first',
        paragraphs: [
          'Treat AI as a tool, not as the final decision-maker. You bring the goal, local context, values, and responsibility. AI can suggest a route, but you decide whether that route is accurate, fair, and useful.',
        ],
      },
    ],
    knowledgeCheck: [],
  },
  {
    number: '02',
    slug: 'prompting-with-purpose',
    title: 'Prompting with purpose',
    detail: 'Ask clearer questions, improve weak answers, and check the result before using it.',
    duration: '10 min',
    objectives: [
      'Give AI a clear task, useful context, and an output format.',
      'Improve a vague prompt without making it unnecessarily long.',
      'Check important claims instead of trusting a confident answer.',
    ],
    sections: [
      {
        heading: 'A prompt is an instruction',
        paragraphs: [
          'A prompt is the message you give an AI tool. A useful prompt tells the tool what you need, why you need it, and what a good answer should look like.',
          'You do not need complicated words. Clear language works better than trying to sound technical.',
        ],
      },
      {
        heading: 'Use task, context, and format',
        paragraphs: [
          'Start with the task: explain, compare, plan, rewrite, or create. Add only the context that changes the answer. Then name the format you want, such as three bullet points, a short table, or a Grade 10 explanation.',
          'For example, “Help me study” is vague. A clearer prompt is: “Create five short practice questions about photosynthesis for a Grade 10 student. Put the answers after the questions.”',
        ],
      },
      {
        heading: 'Improve the conversation',
        paragraphs: [
          'The first answer does not need to be the final answer. Tell the tool what is missing: “Use simpler language,” “Give an Ethiopian example,” or “Shorten this to 100 words.”',
          'Change one or two things at a time. This makes it easier to see which instruction improved the result.',
        ],
      },
      {
        heading: 'Check before you use',
        paragraphs: [
          'A strong prompt can still produce a wrong answer. Check names, dates, statistics, quotations, and safety advice with a reliable source. If the tool gives sources, open them and confirm they support the claim.',
          'Keep private information out of prompts. Replace real names and personal details with general descriptions whenever possible.',
        ],
      },
    ],
    knowledgeCheck: [
      {
        id: 'clear-prompt',
        prompt: 'Which prompt gives the clearest direction?',
        options: [
          'Help me study science.',
          'Create five short photosynthesis questions for a Grade 10 student. Put the answers after the questions.',
          'Tell me everything you know.',
        ],
        correctOption: 1,
        explanation: 'It gives a specific task, learner context, amount, and output format.',
      },
      {
        id: 'verify-claim',
        prompt: 'An AI answer includes a statistic but no reliable source. What should you do?',
        options: [
          'Use it because the answer sounds confident.',
          'Ask for a source and verify the statistic before using it.',
          'Change the wording so nobody notices.',
        ],
        correctOption: 1,
        explanation: 'Confidence is not evidence. Important claims should be checked with a reliable source.',
      },
      {
        id: 'improve-result',
        prompt: 'The first answer is too broad. What is the best next step?',
        options: [
          'Add the missing context and say what format you need.',
          'Repeat the same prompt many times.',
          'Share private details so the answer feels personal.',
        ],
        correctOption: 0,
        explanation: 'A small, clear improvement helps the AI respond more usefully without exposing private information.',
      },
    ],
  },
  {
    number: '03',
    slug: 'responsible-use',
    title: 'Responsible use',
    detail: 'Explore privacy, misinformation, bias, and when human judgment must lead.',
    duration: '10 min',
    objectives: [],
    sections: [],
    knowledgeCheck: [],
  },
  {
    number: '04',
    slug: 'build-an-ethiopian-solution',
    title: 'Build an Ethiopian solution',
    detail: 'Turn a local challenge into a small, documented project you can share.',
    duration: 'Project',
    objectives: [],
    sections: [],
    knowledgeCheck: [],
  },
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
