import { validCourseId } from './courseModel'

export const lessonStatusOptions = ['draft', 'ready', 'published'] as const
export type LessonStatus = typeof lessonStatusOptions[number]

export type PracticeQuestion = {
  enabled: boolean
  prompt: string
  options: [string, string, string]
  correctOption: number
  explanation: string
}

export type LessonFormValues = {
  courseId: string
  lessonId: string
  order: string
  title: string
  summary: string
  durationMinutes: string
  videoYoutubeId: string
  bodyMarkdown: string
  question1: PracticeQuestion
  question2: PracticeQuestion
  question3: PracticeQuestion
}

export type LessonContent = Omit<LessonFormValues, 'order' | 'durationMinutes'> & {
  order: number
  durationMinutes: number
}

export type LessonDraft = LessonContent & {
  status: LessonStatus
  revision: number
  latestReleaseNumber: number
  latestReleaseId: string
  createdAt: unknown
  createdBy: string
  updatedAt: unknown
  updatedBy: string
  lastAuditId: string
}

export type LessonRelease = LessonContent & {
  releaseId: string
  version: number
  draftRevision: number
  publishedAt: unknown
  publishedBy: string
  auditId: string
}

export const emptyQuestion: PracticeQuestion = {
  enabled: false,
  prompt: '',
  options: ['', '', ''],
  correctOption: 0,
  explanation: '',
}

export const emptyLessonForm: LessonFormValues = {
  courseId: '',
  lessonId: '',
  order: '1',
  title: '',
  summary: '',
  durationMinutes: '15',
  videoYoutubeId: '',
  bodyMarkdown: '',
  question1: { ...emptyQuestion, options: [...emptyQuestion.options] },
  question2: { ...emptyQuestion, options: [...emptyQuestion.options] },
  question3: { ...emptyQuestion, options: [...emptyQuestion.options] },
}

export function validLessonId(value: string) {
  return value.length >= 3
    && value.length <= 64
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}

function normalizeQuestion(question: PracticeQuestion): PracticeQuestion {
  return {
    enabled: question.enabled,
    prompt: question.prompt.trim(),
    options: [question.options[0].trim(), question.options[1].trim(), question.options[2].trim()],
    correctOption: Number(question.correctOption),
    explanation: question.explanation.trim(),
  }
}

function validateQuestion(question: PracticeQuestion, label: string, errors: string[]) {
  if (!question.enabled) return
  if (question.prompt.length < 12 || question.prompt.length > 240) errors.push(`${label} prompt must be 12-240 characters.`)
  question.options.forEach((option, index) => {
    if (option.length < 1 || option.length > 160) errors.push(`${label} option ${index + 1} must be 1-160 characters.`)
  })
  if (!Number.isInteger(question.correctOption) || question.correctOption < 0 || question.correctOption > 2) errors.push(`${label} needs one correct answer.`)
  if (question.explanation.length < 12 || question.explanation.length > 300) errors.push(`${label} explanation must be 12-300 characters.`)
}

export function normalizeLessonForm(values: LessonFormValues) {
  const content: LessonContent = {
    courseId: values.courseId.trim(),
    lessonId: values.lessonId.trim(),
    order: Number(values.order),
    title: values.title.trim(),
    summary: values.summary.trim(),
    durationMinutes: Number(values.durationMinutes),
    videoYoutubeId: values.videoYoutubeId.trim(),
    bodyMarkdown: values.bodyMarkdown.trim(),
    question1: normalizeQuestion(values.question1),
    question2: normalizeQuestion(values.question2),
    question3: normalizeQuestion(values.question3),
  }
  const errors: string[] = []
  if (!validCourseId(content.courseId)) errors.push('Choose a valid course before saving a lesson.')
  if (!validLessonId(content.lessonId)) errors.push('Lesson ID must use 3-64 lowercase letters, numbers, and single hyphens.')
  if (!Number.isInteger(content.order) || content.order < 1 || content.order > 50) errors.push('Lesson order must be a whole number from 1 to 50.')
  if (content.title.length < 5 || content.title.length > 100) errors.push('Lesson title must be 5-100 characters.')
  if (content.summary.length < 20 || content.summary.length > 240) errors.push('Lesson summary must be 20-240 characters.')
  if (!Number.isInteger(content.durationMinutes) || content.durationMinutes < 5 || content.durationMinutes > 300) errors.push('Lesson time must be 5-300 minutes.')
  if (content.videoYoutubeId && !/^[A-Za-z0-9_-]{11}$/.test(content.videoYoutubeId)) errors.push('YouTube ID must be empty or exactly 11 characters.')
  if (content.bodyMarkdown.length < 100 || content.bodyMarkdown.length > 12000) errors.push('Written lesson must be 100-12,000 characters.')
  validateQuestion(content.question1, 'Question 1', errors)
  validateQuestion(content.question2, 'Question 2', errors)
  validateQuestion(content.question3, 'Question 3', errors)
  return { content, errors }
}

export function formFromLesson(draft: LessonDraft): LessonFormValues {
  return {
    courseId: draft.courseId,
    lessonId: draft.lessonId,
    order: String(draft.order),
    title: draft.title,
    summary: draft.summary,
    durationMinutes: String(draft.durationMinutes),
    videoYoutubeId: draft.videoYoutubeId,
    bodyMarkdown: draft.bodyMarkdown,
    question1: { ...draft.question1, options: [...draft.question1.options] },
    question2: { ...draft.question2, options: [...draft.question2.options] },
    question3: { ...draft.question3, options: [...draft.question3.options] },
  }
}

export function lessonContentMatches(draft: LessonDraft, content: LessonContent) {
  return draft.courseId === content.courseId
    && draft.lessonId === content.lessonId
    && draft.order === content.order
    && draft.title === content.title
    && draft.summary === content.summary
    && draft.durationMinutes === content.durationMinutes
    && draft.videoYoutubeId === content.videoYoutubeId
    && draft.bodyMarkdown === content.bodyMarkdown
    && JSON.stringify(draft.question1) === JSON.stringify(content.question1)
    && JSON.stringify(draft.question2) === JSON.stringify(content.question2)
    && JSON.stringify(draft.question3) === JSON.stringify(content.question3)
}
