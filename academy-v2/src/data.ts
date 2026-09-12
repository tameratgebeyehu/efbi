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
  videoYoutubeId?: string
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
    detail: 'Protect people, question unreliable results, and know when a person must make the decision.',
    duration: '12 min',
    objectives: [
      'Protect private information when using AI tools.',
      'Notice misinformation and unfair or incomplete results.',
      'Choose when AI can assist and when human judgment must lead.',
    ],
    sections: [
      {
        heading: 'Protect people and their information',
        paragraphs: [
          'Before entering information into an AI tool, ask whether it belongs to you and whether it needs to be shared. Keep passwords, identification numbers, private messages, school records, health information, and another person’s details out of prompts.',
          'Use a general description when the real identity is not needed. For example, write “a Grade 10 student” instead of a student’s name, school, phone number, and personal story.',
        ],
      },
      {
        heading: 'Do not confuse confidence with truth',
        paragraphs: [
          'AI can invent facts, sources, quotations, or instructions while sounding certain. Pause before sharing an answer that could affect someone’s education, health, safety, money, or reputation.',
          'Check important claims with a reliable source. If you cannot confirm a claim, say that it is uncertain or leave it out.',
        ],
      },
      {
        heading: 'Look for unfair results',
        paragraphs: [
          'AI learns from data made by people and institutions. Missing communities, old assumptions, and unequal examples can lead to biased results.',
          'Ask who may be missing or harmed. Test more than one example, include local context, and invite feedback from people affected by the result.',
        ],
      },
      {
        heading: 'Keep a person responsible',
        paragraphs: [
          'Use AI as support, not as an excuse. Follow your school’s rules, explain meaningful AI help in your work, and never present generated work as your own when that is not allowed.',
          'A person should make the final decision when the result affects rights, safety, opportunities, or another person’s future. Responsible builders can explain what the tool did, what they checked, and why they chose the final answer.',
        ],
      },
    ],
    knowledgeCheck: [
      {
        id: 'protect-private-data',
        prompt: 'A classmate asks you to summarize a document containing student phone numbers. What is the safest first step?',
        options: [
          'Upload the complete document because the task is educational.',
          'Remove personal details and use only the information needed for the summary.',
          'Ask the AI to promise that it will keep the document private.',
        ],
        correctOption: 1,
        explanation: 'Share the minimum information needed and remove details that can identify people.',
      },
      {
        id: 'check-confident-claim',
        prompt: 'An AI gives a confident health claim with a source you cannot find. What should you do?',
        options: [
          'Share it quickly because it includes a source name.',
          'Rewrite it in simpler words and treat it as correct.',
          'Do not rely on it; verify it with a trustworthy source or qualified person.',
        ],
        correctOption: 2,
        explanation: 'A confident tone or invented citation is not evidence, especially when health or safety is involved.',
      },
      {
        id: 'human-decision',
        prompt: 'Which decision should not be left to an AI system alone?',
        options: [
          'Suggesting three titles for a school poster.',
          'Deciding which student deserves a scholarship.',
          'Changing a paragraph into bullet points.',
        ],
        correctOption: 1,
        explanation: 'A high-impact decision about a person’s opportunity needs accountable human review.',
      },
    ],
  },
  {
    number: '04',
    slug: 'build-an-ethiopian-solution',
    title: 'Build an Ethiopian solution',
    detail: 'Choose one local problem, build a small first solution, test it safely, and explain what you learned.',
    duration: '45–90 min',
    objectives: [
      'Turn a real local challenge into a focused problem statement.',
      'Build and test the smallest useful version of an idea.',
      'Document evidence, limitations, and any meaningful AI assistance honestly.',
    ],
    sections: [
      {
        heading: 'Start with a real problem',
        paragraphs: [
          'Look for a repeated difficulty in your school or community. You might notice that students miss club announcements, a library cannot see which books learners need, or a study group struggles to organize revision materials.',
          'Talk with people who experience the problem, but ask permission before taking notes or photographs. Do not collect names, phone numbers, grades, health details, or other private information unless the project truly needs them and you have a safe plan.',
        ],
      },
      {
        heading: 'Make the first goal small',
        paragraphs: [
          'Write one sentence that names the people, the problem, and the improvement you want. For example: “Help members of one school science club find this week’s meeting topic without asking the organizer.”',
          'Choose a result you can observe. Five classmates finding the correct topic in under a minute is clearer than saying that the project will improve education everywhere.',
        ],
      },
      {
        heading: 'Build the smallest useful version',
        paragraphs: [
          'Your first version can be a paper sketch, a spreadsheet, a simple web page, or a clickable prototype. Build only what you need to test the main idea.',
          'AI may help you brainstorm, rewrite instructions, or explain code. Check every result, remove private information from prompts, and keep notes about what the tool contributed.',
        ],
      },
      {
        heading: 'Test safely and improve',
        paragraphs: [
          'Ask a few intended users to try the prototype. Tell them what you are testing, let them choose whether to participate, and use sample information instead of real personal data.',
          'Watch where people become confused. Record patterns rather than private details, choose one useful improvement, and test again.',
        ],
      },
      {
        heading: 'Show honest evidence',
        paragraphs: [
          'Document the problem, intended users, first version, feedback, change, and remaining limitation. A small project with clear evidence is stronger than a large claim you cannot support.',
          'Explain what you built yourself, what help you received, and how you used AI. This reflection will prepare you for EFBI’s future reviewed assessment and project submission; finishing this lesson alone does not issue a certificate.',
        ],
      },
    ],
    knowledgeCheck: [
      {
        id: 'focused-local-problem',
        prompt: 'Which is the strongest first project goal?',
        options: [
          'Use AI to solve every education problem in Ethiopia.',
          'Help one school science club share its weekly meeting topic clearly.',
          'Build a large app before speaking with any learner.',
        ],
        correctOption: 1,
        explanation: 'It names a specific group and a small problem that can be tested.',
      },
      {
        id: 'safe-project-test',
        prompt: 'What is the safest way to test an early student-information prototype?',
        options: [
          'Use sample records and ask participants for consent.',
          'Copy real student records so the test feels realistic.',
          'Collect every detail now in case it becomes useful later.',
        ],
        correctOption: 0,
        explanation: 'Sample data and informed participation reduce unnecessary privacy risk.',
      },
      {
        id: 'honest-project-evidence',
        prompt: 'What belongs in an honest project summary?',
        options: [
          'Only the final screenshot and a claim that everyone liked it.',
          'The problem, prototype, feedback, changes, limitations, and meaningful AI help.',
          'A list of features you hope to build someday presented as completed work.',
        ],
        correctOption: 1,
        explanation: 'Clear evidence and honest limits show how the project actually developed.',
      },
    ],
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
