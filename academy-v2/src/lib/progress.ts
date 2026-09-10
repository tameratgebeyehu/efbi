import { getFirebaseFirestore } from './firebase'

export type CourseProgress = {
  completedLessonIds: string[]
  lastLessonId: string
  percent: number
}

type ProgressOptions = {
  uid: string
  courseId: string
  allowedLessonIds: string[]
  totalLessonCount: number
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
  const completedLessonIds = [...new Set(data.completedLessonIds.filter((value): value is string => typeof value === 'string' && allowed.has(value)))]
  const storedLastLessonId = typeof data.lastLessonId === 'string' ? data.lastLessonId : ''
  const lastLessonId = completedLessonIds.includes(storedLastLessonId) ? storedLastLessonId : completedLessonIds.at(-1) ?? ''

  return {
    completedLessonIds,
    lastLessonId,
    percent: Math.round((completedLessonIds.length / totalLessonCount) * 100),
  }
}

async function requireFirestore() {
  const services = await getFirebaseFirestore()
  if (!services) throw new Error('Course progress is not connected yet.')
  return services
}

export async function readCourseProgress({ uid, courseId, allowedLessonIds, totalLessonCount }: ProgressOptions) {
  const { db, firestoreSdk } = await requireFirestore()
  const reference = firestoreSdk.doc(db, 'users', uid, 'progress', courseId)
  const snapshot = await firestoreSdk.getDoc(reference)
  return snapshot.exists()
    ? normalizeProgress(snapshot.data(), allowedLessonIds, totalLessonCount)
    : emptyProgress
}

export async function completeLesson({ uid, courseId, lessonId, allowedLessonIds, totalLessonCount }: CompleteLessonOptions) {
  if (!allowedLessonIds.includes(lessonId)) throw new Error('This lesson is not open for completion yet.')
  if (totalLessonCount < 1) throw new Error('The course outline is not ready.')

  const { db, firestoreSdk } = await requireFirestore()
  const reference = firestoreSdk.doc(db, 'users', uid, 'progress', courseId)

  return firestoreSdk.runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(reference)
    const current = snapshot.exists()
      ? normalizeProgress(snapshot.data(), allowedLessonIds, totalLessonCount)
      : emptyProgress

    if (current.completedLessonIds.includes(lessonId)) return current

    const completedLessonIds = [...current.completedLessonIds, lessonId]
    const progress: CourseProgress = {
      completedLessonIds,
      lastLessonId: lessonId,
      percent: Math.round((completedLessonIds.length / totalLessonCount) * 100),
    }

    transaction.set(reference, {
      courseId,
      completedLessonIds: progress.completedLessonIds,
      lastLessonId: progress.lastLessonId,
      percent: progress.percent,
      createdAt: snapshot.exists() ? snapshot.data().createdAt : firestoreSdk.serverTimestamp(),
      updatedAt: firestoreSdk.serverTimestamp(),
    })

    return progress
  })
}