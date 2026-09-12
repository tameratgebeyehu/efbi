import { getFirebaseFirestore } from './firebase'

export type CourseProgress = {
  completedLessonIds: string[]
  lastLessonId: string
  percent: number
  versionId?: string
  courseVersion?: number
  lessonCount?: number
}

export type ProgressBinding =
  | { kind: 'none' }
  | { kind: 'legacy' }
  | { kind: 'versioned'; versionId: string; courseVersion: number; lessonCount: number }

type ProgressOptions = {
  uid: string
  courseId: string
  allowedLessonIds: string[]
  totalLessonCount: number
  versionId?: string
  courseVersion?: number
}

type CompleteLessonOptions = ProgressOptions & {
  lessonId: string
}

const emptyProgress: CourseProgress = {
  completedLessonIds: [],
  lastLessonId: '',
  percent: 0,
}

function normalizeProgress(data: Record<string, unknown> | undefined, allowedLessonIds: string[], totalLessonCount: number): CourseProgress {
  if (!data || !Array.isArray(data.completedLessonIds) || totalLessonCount < 1) return emptyProgress

  const allowed = new Set(allowedLessonIds)
  const savedLessonIds = new Set(data.completedLessonIds.filter((value): value is string => typeof value === 'string' && allowed.has(value)))
  const completedLessonIds = allowedLessonIds.filter((lessonId) => savedLessonIds.has(lessonId))
  const storedLastLessonId = typeof data.lastLessonId === 'string' ? data.lastLessonId : ''
  const lastLessonId = completedLessonIds.includes(storedLastLessonId) ? storedLastLessonId : completedLessonIds.at(-1) ?? ''

  const progress: CourseProgress = {
    completedLessonIds,
    lastLessonId,
    percent: Math.round((completedLessonIds.length / totalLessonCount) * 100),
  }
  if (
    typeof data.versionId === 'string'
    && typeof data.courseVersion === 'number'
    && typeof data.lessonCount === 'number'
  ) {
    progress.versionId = data.versionId
    progress.courseVersion = data.courseVersion
    progress.lessonCount = data.lessonCount
  }
  return progress
}

async function requireFirestore() {
  const services = await getFirebaseFirestore()
  if (!services) throw new Error('Course progress is not connected yet.')
  return services
}

export async function readCourseProgress({ uid, courseId, allowedLessonIds, totalLessonCount, versionId, courseVersion }: ProgressOptions) {
  const { db, firestoreSdk } = await requireFirestore()
  const reference = firestoreSdk.doc(db, 'users', uid, 'progress', courseId)
  const snapshot = await firestoreSdk.getDoc(reference)
  const progress = snapshot.exists()
    ? normalizeProgress(snapshot.data(), allowedLessonIds, totalLessonCount)
    : emptyProgress
  if (snapshot.exists() && versionId && (progress.versionId !== versionId || progress.courseVersion !== courseVersion)) {
    throw new Error('Your saved course version does not match this learning path.')
  }
  if (snapshot.exists() && !versionId && progress.versionId) {
    throw new Error('Your saved course version could not be opened safely.')
  }
  return progress
}

export async function readProgressBinding({ uid, courseId }: { uid: string; courseId: string }): Promise<ProgressBinding> {
  const { db, firestoreSdk } = await requireFirestore()
  const reference = firestoreSdk.doc(db, 'users', uid, 'progress', courseId)
  const snapshot = await firestoreSdk.getDoc(reference)
  if (!snapshot.exists()) return { kind: 'none' }

  const data = snapshot.data()
  if (
    typeof data.versionId === 'string'
    && data.versionId.length >= 8
    && typeof data.courseVersion === 'number'
    && Number.isInteger(data.courseVersion)
    && typeof data.lessonCount === 'number'
    && Number.isInteger(data.lessonCount)
  ) {
    return {
      kind: 'versioned',
      versionId: data.versionId,
      courseVersion: data.courseVersion,
      lessonCount: data.lessonCount,
    }
  }
  return { kind: 'legacy' }
}

export async function completeLesson({ uid, courseId, lessonId, allowedLessonIds, totalLessonCount, versionId, courseVersion }: CompleteLessonOptions) {
  const lessonIndex = allowedLessonIds.indexOf(lessonId)
  if (lessonIndex < 0) throw new Error('This lesson is not open for completion yet.')
  if (totalLessonCount < 1) throw new Error('The course outline is not ready.')
  const prerequisiteLessonIds = allowedLessonIds.slice(0, lessonIndex)

  const { db, firestoreSdk } = await requireFirestore()
  const reference = firestoreSdk.doc(db, 'users', uid, 'progress', courseId)

  return firestoreSdk.runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(reference)
    const savedVersionId = snapshot.exists() && typeof snapshot.data().versionId === 'string' ? snapshot.data().versionId : ''
    if (savedVersionId && savedVersionId !== versionId) throw new Error('Your saved course version does not match this learning path.')
    if (!savedVersionId && snapshot.exists() && versionId) throw new Error('Your original course progress cannot be changed to a different version.')
    const current = snapshot.exists()
      ? normalizeProgress(snapshot.data(), allowedLessonIds, totalLessonCount)
      : emptyProgress

    if (current.completedLessonIds.includes(lessonId)) return current
    if (!prerequisiteLessonIds.every((requiredId) => current.completedLessonIds.includes(requiredId))) {
      throw new Error('Complete the earlier lesson before saving this one.')
    }

    const completedLessonIds = [...current.completedLessonIds, lessonId]
    const progress: CourseProgress = {
      completedLessonIds,
      lastLessonId: lessonId,
      percent: Math.round((completedLessonIds.length / totalLessonCount) * 100),
    }

    const timestamps = {
      createdAt: snapshot.exists() ? snapshot.data().createdAt : firestoreSdk.serverTimestamp(),
      updatedAt: firestoreSdk.serverTimestamp(),
    }
    const versioned = typeof versionId === 'string' && versionId.length >= 8 && Number.isInteger(courseVersion)
    transaction.set(reference, versioned ? {
      courseId,
      versionId,
      courseVersion,
      lessonCount: totalLessonCount,
      completedLessonIds: progress.completedLessonIds,
      lastLessonId: progress.lastLessonId,
      ...timestamps,
    } : {
      courseId,
      completedLessonIds: progress.completedLessonIds,
      lastLessonId: progress.lastLessonId,
      percent: progress.percent,
      ...timestamps,
    })

    return progress
  })
}
