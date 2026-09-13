import { curriculum, type CourseLesson, type KnowledgeCheckQuestion } from '../data'
import { getFirebaseFirestore } from './firebase'

export type CourseCatalog = {
  source: 'built-in' | 'backend-release' | 'published-version'
  courseId: string
  versionId?: string
  courseVersion?: number
  assessmentVersion?: number
  assessmentType: 'practice-only' | 'project'
  lessons: CourseLesson[]
  courseTitle: string
  courseDescription: string
  level: string
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
  questions: ReleaseQuestion[]
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

type CourseVersionRecord = {
  versionId: string
  courseId: string
  courseTitle: string
  courseVersion: number
  assessmentVersion: number
  assessmentType: 'practice-only' | 'project'
  lessonIds: string[]
}

type ActiveCourseRecord = {
  courseId: string
  versionId: string
  courseVersion: number
  courseTitle: string
  lessonCount: number
  assessmentVersion: number
  assessmentType: 'practice-only' | 'project'
}

export type ActiveCourseSummary = {
  courseId: string
  courseTitle: string
  courseDescription: string
  level: string
  lessonCount: number
  courseVersion: number
  assessmentVersion: number
  assessmentType: 'practice-only' | 'project'
}

const aiCourseId = 'ai-foundations'
const aiLessonIds = curriculum.map((lesson) => lesson.slug)
const aiFallbackCatalog: CourseCatalog = {
  source: 'built-in',
  courseId: aiCourseId,
  assessmentType: 'project',
  lessons: curriculum,
  courseTitle: 'AI Foundations for Ethiopia',
  courseDescription: 'Four short lessons that help you understand AI and use it responsibly.',
  level: 'Beginner',
  statusMessage: 'Using the tested built-in course while EFBI checks backend releases.',
}

function safeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function safeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function validCourseId(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length >= 3 && value.length <= 60
}

function validLessonId(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length >= 3 && value.length <= 80
}

function asCourseRelease(data: Record<string, unknown>, expectedCourseId: string): CourseReleaseRecord | null {
  const courseId = safeString(data.courseId)
  if (courseId !== expectedCourseId) return null
  return {
    courseId,
    title: safeString(data.title),
    summary: safeString(data.summary),
    description: safeString(data.description),
    level: safeString(data.level),
    estimatedMinutes: safeNumber(data.estimatedMinutes),
    version: safeNumber(data.version),
  }
}

function asLessonRelease(id: string, data: Record<string, unknown>, expectedCourseId: string): LessonReleaseRecord | null {
  const lessonId = safeString(data.lessonId)
  const courseId = safeString(data.courseId)
  if (courseId !== expectedCourseId || !validLessonId(lessonId)) return null
  const questions = Array.isArray(data.questions)
    ? data.questions.slice(0, 3) as ReleaseQuestion[]
    : [data.question1, data.question2, data.question3].map((question) => (question ?? {}) as ReleaseQuestion)
  return {
    releaseId: id,
    lessonId,
    courseId,
    order: safeNumber(data.order),
    title: safeString(data.title),
    summary: safeString(data.summary),
    durationMinutes: safeNumber(data.durationMinutes),
    videoYoutubeId: safeString(data.videoYoutubeId),
    bodyMarkdown: safeString(data.bodyMarkdown),
    questions,
    version: safeNumber(data.version),
  }
}

function asCourseVersion(id: string, data: Record<string, unknown>, expectedCourseId: string): CourseVersionRecord | null {
  const courseId = safeString(data.courseId)
  const lessonIds = Array.isArray(data.lessonIds) ? data.lessonIds.map(safeString) : []
  const assessmentType = data.assessmentType === 'practice-only' || data.assessmentType === 'project' ? data.assessmentType : null
  if (
    safeString(data.versionId) !== id
    || courseId !== expectedCourseId
    || !assessmentType
    || lessonIds.length < 1
    || lessonIds.length > 12
    || new Set(lessonIds).size !== lessonIds.length
    || lessonIds.some((lessonId) => !validLessonId(lessonId))
  ) return null

  return {
    versionId: id,
    courseId,
    courseTitle: safeString(data.courseTitle),
    courseVersion: safeNumber(data.courseVersion),
    assessmentVersion: safeNumber(data.assessmentVersion),
    assessmentType,
    lessonIds,
  }
}

function asActiveCourse(data: Record<string, unknown>, expectedCourseId: string): ActiveCourseRecord | null {
  const courseId = safeString(data.courseId)
  const versionId = safeString(data.versionId)
  const courseVersion = safeNumber(data.courseVersion)
  const assessmentType = data.assessmentType === 'practice-only' || data.assessmentType === 'project' ? data.assessmentType : null
  const lessonCount = safeNumber(data.lessonCount)
  const assessmentVersion = safeNumber(data.assessmentVersion)
  if (courseId !== expectedCourseId || versionId.length < 8 || courseVersion < 1 || !assessmentType || lessonCount < 1 || lessonCount > 12 || assessmentVersion < 1) return null
  return {
    courseId,
    versionId,
    courseVersion,
    courseTitle: safeString(data.courseTitle),
    lessonCount,
    assessmentVersion,
    assessmentType,
  }
}

function latestById(records: LessonReleaseRecord[], lessonIds: string[]) {
  const releases = new Map<string, LessonReleaseRecord>()
  for (const record of records) {
    const current = releases.get(record.lessonId)
    if (!current || record.version > current.version) releases.set(record.lessonId, record)
  }
  return lessonIds.map((lessonId) => releases.get(lessonId))
}

function releaseVersionById(records: LessonReleaseRecord[], lessonIds: string[], version: number) {
  return lessonIds.map((lessonId) => records.find((record) => record.lessonId === lessonId && record.version === version))
}

function normalizeQuestion(question: ReleaseQuestion, lessonId: string, index: number): KnowledgeCheckQuestion | null {
  if (question.enabled === false) return null
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

function compatibleBackendCatalog(
  courseId: string,
  course: CourseReleaseRecord | null,
  releases: Array<LessonReleaseRecord | undefined>,
  lessonIds: string[],
  version?: CourseVersionRecord,
): CourseCatalog | null {
  if (!course || releases.some((release) => !release)) return null

  const lessons = releases.map((release, index) => {
    const lessonRelease = release!
    const fallback = courseId === aiCourseId ? curriculum.find((lesson) => lesson.slug === lessonRelease.lessonId) : undefined
    const sections = markdownToSections(lessonRelease.bodyMarkdown)
    const knowledgeCheck = lessonRelease.questions
      .map((question, questionIndex) => normalizeQuestion(question, lessonRelease.lessonId, questionIndex))
      .filter((question): question is KnowledgeCheckQuestion => Boolean(question))
    const detail = lessonRelease.summary || fallback?.detail || `Learn and practice ${lessonRelease.title.toLowerCase()}.`

    return {
      number: String(index + 1).padStart(2, '0'),
      slug: lessonIds[index],
      title: lessonRelease.title || fallback?.title || `Lesson ${index + 1}`,
      detail,
      duration: `${lessonRelease.durationMinutes || Number.parseInt(fallback?.duration ?? '', 10) || 10} min`,
      videoYoutubeId: /^[A-Za-z0-9_-]{11}$/.test(lessonRelease.videoYoutubeId) ? lessonRelease.videoYoutubeId : undefined,
      objectives: fallback?.objectives ?? [detail],
      sections: sections.length > 0 ? sections : fallback?.sections ?? [],
      knowledgeCheck: knowledgeCheck.length > 0 ? knowledgeCheck : fallback?.knowledgeCheck ?? [],
    }
  })

  if (lessons.some((lesson) => lesson.sections.length < 1)) return null

  return {
    source: version ? 'published-version' : 'backend-release',
    courseId,
    versionId: version?.versionId,
    courseVersion: version?.courseVersion,
    assessmentVersion: version?.assessmentVersion,
    assessmentType: version?.assessmentType ?? 'project',
    lessons,
    courseTitle: course.title || version?.courseTitle || 'EFBI course',
    courseDescription: course.summary || course.description || 'A practical EFBI learning path.',
    level: course.level || 'Beginner',
    statusMessage: version ? `Using reviewed course version ${version.courseVersion}.` : 'Using the latest tested EFBI course release.',
  }
}

async function loadReleaseRecords(
  services: NonNullable<Awaited<ReturnType<typeof getFirebaseFirestore>>>,
  courseId: string,
) {
  const { collection, getDocs } = services.firestoreSdk
  const [courseSnapshot, lessonSnapshot] = await Promise.all([
    getDocs(collection(services.db, 'courseReleases')),
    getDocs(collection(services.db, 'lessonReleases')),
  ])
  const courses = courseSnapshot.docs
    .map((item) => asCourseRelease(item.data(), courseId))
    .filter((item): item is CourseReleaseRecord => Boolean(item))
  const lessons = lessonSnapshot.docs
    .map((item) => asLessonRelease(item.id, item.data(), courseId))
    .filter((item): item is LessonReleaseRecord => Boolean(item))
  return { courses, lessons }
}

type LoadCourseCatalogOptions = {
  preferredVersionId?: string
  legacy?: boolean
}

export async function loadCourseCatalog(courseIdValue: string, options: LoadCourseCatalogOptions = {}): Promise<CourseCatalog | null> {
  const courseId = courseIdValue.trim()
  const fallback = courseId === aiCourseId ? aiFallbackCatalog : null
  if (!validCourseId(courseId)) return null

  const services = await getFirebaseFirestore()
  if (!services) return fallback

  try {
    const { doc, getDoc } = services.firestoreSdk
    let versionId = options.preferredVersionId?.trim() ?? ''

    if (!versionId && !options.legacy) {
      const activeSnapshot = await getDoc(doc(services.db, 'activeCourses', courseId))
      if (activeSnapshot.exists()) versionId = asActiveCourse(activeSnapshot.data(), courseId)?.versionId ?? ''
    }

    const releases = await loadReleaseRecords(services, courseId)
    if (versionId) {
      const versionSnapshot = await getDoc(doc(services.db, 'courseVersions', versionId))
      const version = versionSnapshot.exists() ? asCourseVersion(versionSnapshot.id, versionSnapshot.data(), courseId) : null
      if (!version) return null
      const course = releases.courses.find((record) => record.version === version.courseVersion) ?? null
      const lessons = releaseVersionById(releases.lessons, version.lessonIds, version.courseVersion)
      return compatibleBackendCatalog(courseId, course, lessons, version.lessonIds, version)
    }

    if (courseId !== aiCourseId) return null
    const latestCourse = releases.courses.sort((left, right) => right.version - left.version)[0] ?? null
    return compatibleBackendCatalog(courseId, latestCourse, latestById(releases.lessons, aiLessonIds), aiLessonIds) ?? fallback
  } catch {
    return fallback
  }
}

export async function loadActiveCourseSummaries(): Promise<ActiveCourseSummary[]> {
  const services = await getFirebaseFirestore()
  if (!services) return []

  try {
    const { collection, getDocs } = services.firestoreSdk
    const [activeSnapshot, versionSnapshot, releaseSnapshot, lessonSnapshot] = await Promise.all([
      getDocs(collection(services.db, 'activeCourses')),
      getDocs(collection(services.db, 'courseVersions')),
      getDocs(collection(services.db, 'courseReleases')),
      getDocs(collection(services.db, 'lessonReleases')),
    ])
    const activeCourses = activeSnapshot.docs
      .map((item) => asActiveCourse(item.data(), item.id))
      .filter((item): item is ActiveCourseRecord => Boolean(item))
    const versions = versionSnapshot.docs
      .map((item) => {
        const data = item.data()
        const courseId = safeString(data.courseId)
        return validCourseId(courseId) ? asCourseVersion(item.id, data, courseId) : null
      })
      .filter((item): item is CourseVersionRecord => Boolean(item))
    const releases = releaseSnapshot.docs
      .map((item) => {
        const data = item.data()
        const courseId = safeString(data.courseId)
        return validCourseId(courseId) ? asCourseRelease(data, courseId) : null
      })
      .filter((item): item is CourseReleaseRecord => Boolean(item))
    const lessons = lessonSnapshot.docs
      .map((item) => {
        const data = item.data()
        const courseId = safeString(data.courseId)
        return validCourseId(courseId) ? asLessonRelease(item.id, data, courseId) : null
      })
      .filter((item): item is LessonReleaseRecord => Boolean(item))

    return activeCourses
      .map((active) => {
        const version = versions.find((item) => item.versionId === active.versionId && item.courseId === active.courseId)
        const release = releases.find((item) => item.courseId === active.courseId && item.version === active.courseVersion)
        const completeLessons = version?.lessonIds.every((lessonId) => lessons.some((item) => item.courseId === active.courseId && item.lessonId === lessonId && item.version === active.courseVersion))
        if (!version || version.lessonIds.length !== active.lessonCount || !release || !completeLessons) return null
        return {
          courseId: active.courseId,
          courseTitle: release.title || active.courseTitle,
          courseDescription: release.summary || release.description,
          level: release.level || 'Beginner',
          lessonCount: active.lessonCount,
          courseVersion: active.courseVersion,
          assessmentVersion: active.assessmentVersion,
          assessmentType: active.assessmentType,
        }
      })
      .filter((item): item is ActiveCourseSummary => Boolean(item))
      .sort((left, right) => left.courseTitle.localeCompare(right.courseTitle))
  } catch {
    return []
  }
}

export function getFallbackCatalog(courseId = aiCourseId) {
  return courseId === aiCourseId ? aiFallbackCatalog : null
}
