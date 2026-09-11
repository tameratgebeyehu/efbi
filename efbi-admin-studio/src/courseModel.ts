export const categoryOptions = [
  { value: 'artificial-intelligence', label: 'Artificial intelligence' },
  { value: 'app-development', label: 'AI-assisted app development' },
  { value: 'web-development', label: 'Web development' },
  { value: 'mobile-development', label: 'Mobile app development' },
] as const

export const levelOptions = ['beginner', 'intermediate', 'advanced'] as const

export type CourseCategory = typeof categoryOptions[number]['value']
export type CourseLevel = typeof levelOptions[number]
export type CourseStatus = 'draft' | 'ready' | 'published'

export type CourseFormValues = {
  title: string
  summary: string
  description: string
  category: CourseCategory
  level: CourseLevel
  language: string
  estimatedMinutes: string
}

export type CourseContent = Omit<CourseFormValues, 'estimatedMinutes'> & {
  estimatedMinutes: number
}

export type CourseDraft = CourseContent & {
  courseId: string
  status: CourseStatus
  revision: number
  latestReleaseNumber: number
  latestReleaseId: string
  createdAt: unknown
  createdBy: string
  updatedAt: unknown
  updatedBy: string
  lastAuditId: string
}

export type CourseRelease = CourseContent & {
  releaseId: string
  courseId: string
  version: number
  draftRevision: number
  publishedAt: unknown
  publishedBy: string
  auditId: string
}

export const emptyCourseForm: CourseFormValues = {
  title: '',
  summary: '',
  description: '',
  category: 'artificial-intelligence',
  level: 'beginner',
  language: 'English',
  estimatedMinutes: '120',
}

export function formFromDraft(draft: CourseDraft): CourseFormValues {
  return {
    title: draft.title,
    summary: draft.summary,
    description: draft.description,
    category: draft.category,
    level: draft.level,
    language: draft.language,
    estimatedMinutes: String(draft.estimatedMinutes),
  }
}

export function normalizeCourseForm(values: CourseFormValues) {
  const content: CourseContent = {
    title: values.title.trim(),
    summary: values.summary.trim(),
    description: values.description.trim(),
    category: values.category,
    level: values.level,
    language: values.language.trim(),
    estimatedMinutes: Number(values.estimatedMinutes),
  }
  const errors: string[] = []
  if (content.title.length < 5 || content.title.length > 100) errors.push('Title must be 5–100 characters.')
  if (content.summary.length < 20 || content.summary.length > 240) errors.push('Summary must be 20–240 characters.')
  if (content.description.length < 40 || content.description.length > 4000) errors.push('Description must be 40–4,000 characters.')
  if (!categoryOptions.some((option) => option.value === content.category)) errors.push('Choose a supported program category.')
  if (!levelOptions.includes(content.level)) errors.push('Choose a supported level.')
  if (content.language.length < 2 || content.language.length > 40) errors.push('Language must be 2–40 characters.')
  if (!Number.isInteger(content.estimatedMinutes) || content.estimatedMinutes < 15 || content.estimatedMinutes > 20000) {
    errors.push('Learning time must be a whole number from 15 to 20,000 minutes.')
  }
  return { content, errors }
}

export function validCourseId(value: string) {
  return value.length >= 3
    && value.length <= 64
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}

export function courseContentMatches(draft: CourseDraft, content: CourseContent) {
  return draft.title === content.title
    && draft.summary === content.summary
    && draft.description === content.description
    && draft.category === content.category
    && draft.level === content.level
    && draft.language === content.language
    && draft.estimatedMinutes === content.estimatedMinutes
}

export function categoryLabel(value: CourseCategory) {
  return categoryOptions.find((option) => option.value === value)?.label ?? value
}
