import { curriculum, type CourseLesson, type KnowledgeCheckQuestion } from '../data'
import { getFirebaseFirestore } from './firebase'

export type CourseCatalog = {
  source: 'versioned' | 'backend-release'
  lessons: CourseLesson[]
  courseTitle: string
  courseDescription: string
  statusMessage: string
}

type ReleaseQuestion = {
  enabled?: unknown
  prompt?: unknown
  options?: unknown
  correctOption?: unknown
  explanation?: unknown
}

type LessonReleaseRecord = {
  releaseId: string
  lessonId: string
  courseId: string
  order: number
  title: string
  summary: string
  durationMinutes: number
  videoYoutubeId: string
  bodyMarkdown: string
  question1: ReleaseQuestion
  question2: ReleaseQuestion
  question3: ReleaseQuestion
  version: number
}

type CourseReleaseRecord = {
  courseId: string
  title: string
  summary: string
  description: string
  level: string
  estimatedMinutes: number
  version: number
}

const courseId = 'ai-foundations'
const fallbackLessonIds = curriculum.map((lesson) => lesson.slug)
const fallbackCatalog: CourseCatalog = {
  source: 'versioned',
  lessons: curriculum,
  courseTitle: 'AI Foundations for Ethiopia',
  courseDescription: 'Four short lessons that help you understand AI and use it responsibly.',
  statusMessage: 'Using the tested built-in course while EFBI checks backend releases.',
}

function safeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function safeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function asCourseRelease(data: Record<string, unknown>): CourseReleaseRecord | null {
  const courseIdValue = safeString(data.courseId)
  if (courseIdValue !== courseId) return null
  return {
    courseId: courseIdValue,
    title: safeString(data.title),
    summary: safeString(data.summary),
    description: safeString(data.description),
    level: safeString(data.level),
    estimatedMinutes: safeNumber(data.estimatedMinutes),
    version: safeNumber(data.version),
  }
}

function asLessonRelease(id: string, data: Record<string, unknown>): LessonReleaseRecord | null {
  const lessonId = safeString(data.lessonId)
  const courseIdValue = safeString(data.courseId)
  if (courseIdValue !== courseId || !fallbackLessonIds.includes(lessonId)) return null
  return {
    releaseId: id,
    lessonId,
    courseId: courseIdValue,
    order: safeNumber(data.order),
    title: safeString(data.title),
    summary: safeString(data.summary),
    durationMinutes: safeNumber(data.durationMinutes),
    videoYoutubeId: safeString(data.videoYoutubeId),
    bodyMarkdown: safeString(data.bodyMarkdown),
    question1: (data.question1 ?? {}) as ReleaseQuestion,
    question2: (data.question2 ?? {}) as ReleaseQuestion,
    question3: (data.question3 ?? {}) as ReleaseQuestion,
    version: safeNumber(data.version),
  }
}

function latestById(records: LessonReleaseRecord[]) {
  const releases = new Map<string, LessonReleaseRecord>()
  for (const record of records) {
    const current = releases.get(record.lessonId)
    if (!current || record.version > current.version) releases.set(record.lessonId, record)
  }
  return fallbackLessonIds.map((lessonId) => releases.get(lessonId))
}

function normalizeQuestion(question: ReleaseQuestion, lessonId: string, index: number): KnowledgeCheckQuestion | null {
  if (question.enabled !== true) return null
  const prompt = safeString(question.prompt)
  const options = Array.isArray(question.options) ? question.options.map(safeString).slice(0, 3) : []
  const correctOption = safeNumber(question.correctOption)
  const explanation = safeString(question.explanation)
  if (prompt.length < 12 || options.length !== 3 || options.some((option) => option.length < 1) || correctOption < 0 || correctOption > 2 || explanation.length < 12) return null
  return { id: `${lessonId}-q${index + 1}`, prompt, options: options as [string, string, string], correctOption, explanation }
}

function markdownToSections(markdown: string) {
  const lines = markdown.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const sections: Array<{ heading: string; paragraphs: string[] }> = []
  let current: { heading: string; paragraphs: string[] } | null = null

  for (const line of lines) {
    if (line.startsWith('## ')) {
      current = { heading: line.slice(3).trim() || 'Lesson note', paragraphs: [] }
      sections.push(current)
    } else {
      if (!current) {
        current = { heading: 'Lesson notes', paragraphs: [] }
        sections.push(current)
      }
      current.paragraphs.push(line.replace(/^[-*]\s+/, ''))
    }
  }

  return sections.filter((section) => section.paragraphs.length > 0)
}

function compatibleBackendCatalog(course: CourseReleaseRecord | null, releases: Array<LessonReleaseRecord | undefined>): CourseCatalog | null {
  if (!course || releases.some((release) => !release)) return null

  const lessons = releases.map((release, index) => {
    const fallback = curriculum[index]
    const lessonRelease = release!
    const sections = markdownToSections(lessonRelease.bodyMarkdown)
    const knowledgeCheck = [lessonRelease.question1, lessonRelease.question2, lessonRelease.question3]
      .map((question, questionIndex) => normalizeQuestion(question, lessonRelease.lessonId, questionIndex))
      .filter((question): question is KnowledgeCheckQuestion => Boolean(question))

    return {
      ...fallback,
      number: String(index + 1).padStart(2, '0'),
      slug: fallback.slug,
      title: lessonRelease.title || fallback.title,
      detail: lessonRelease.summary || fallback.detail,
      duration: `${lessonRelease.durationMinutes || Number.parseInt(fallback.duration, 10) || 10} min`,
      videoYoutubeId: /^[A-Za-z0-9_-]{11}$/.test(lessonRelease.videoYoutubeId) ? lessonRelease.videoYoutubeId : undefined,
      sections: sections.length > 0 ? sections : fallback.sections,
      knowledgeCheck: knowledgeCheck.length > 0 ? knowledgeCheck : fallback.knowledgeCheck,
    }
  })

  return {
    source: 'backend-release',
    lessons,
    courseTitle: course.title || fallbackCatalog.courseTitle,
    courseDescription: course.summary || course.description || fallbackCatalog.courseDescription,
    statusMessage: 'Using the latest tested EFBI course release.',
  }
}

export async function loadAiFoundationsCatalog(): Promise<CourseCatalog> {
  const services = await getFirebaseFirestore()
  if (!services) return fallbackCatalog

  try {
    const { collection, getDocs } = services.firestoreSdk
    const [courseSnapshot, lessonSnapshot] = await Promise.all([
      getDocs(collection(services.db, 'courseReleases')),
      getDocs(collection(services.db, 'lessonReleases')),
    ])

    const latestCourse = courseSnapshot.docs
      .map((item) => asCourseRelease(item.data()))
      .filter((item): item is CourseReleaseRecord => Boolean(item))
      .sort((left, right) => right.version - left.version)[0] ?? null

    const lessonReleases = lessonSnapshot.docs
      .map((item) => asLessonRelease(item.id, item.data()))
      .filter((item): item is LessonReleaseRecord => Boolean(item))

    return compatibleBackendCatalog(latestCourse, latestById(lessonReleases)) ?? fallbackCatalog
  } catch {
    return fallbackCatalog
  }
}

export function getFallbackCatalog() {
  return fallbackCatalog
}
