import { programs as fallbackPrograms } from '../data'
import type { Program } from '../data'
import { getFirebaseFirestore } from './firebase'
import { learnerEnrollmentEnabled } from '../site-mode'

type PublishedProgram = {
  programId?: unknown
  title?: unknown
  shortTitle?: unknown
  description?: unknown
  outcome?: unknown
  level?: unknown
  durationWeeks?: unknown
  accent?: unknown
  order?: unknown
  releaseId?: unknown
  version?: unknown
}

const levels = ['beginner', 'intermediate', 'advanced'] as const
const accents = ['green', 'gold', 'blue', 'red'] as const

function asProgram(id: string, data: PublishedProgram): { program: Program; order: number } | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || id.length > 64) return null
  if (data.programId !== id || typeof data.releaseId !== 'string' || data.releaseId.length < 16 || typeof data.version !== 'number' || data.version < 1) return null
  if (typeof data.title !== 'string' || data.title.length < 3 || data.title.length > 80) return null
  if (typeof data.shortTitle !== 'string' || data.shortTitle.length < 2 || data.shortTitle.length > 16) return null
  if (typeof data.description !== 'string' || data.description.length < 20 || data.description.length > 500) return null
  if (typeof data.outcome !== 'string' || data.outcome.length < 20 || data.outcome.length > 300) return null
  if (typeof data.level !== 'string' || !levels.includes(data.level as typeof levels[number])) return null
  if (typeof data.accent !== 'string' || !accents.includes(data.accent as typeof accents[number])) return null
  if (!Number.isInteger(data.durationWeeks) || (data.durationWeeks as number) < 1 || (data.durationWeeks as number) > 52) return null
  if (!Number.isInteger(data.order) || (data.order as number) < 1 || (data.order as number) > 50) return null

  const level = `${data.level[0].toUpperCase()}${data.level.slice(1)}` as Program['level']
  return {
    program: {
      slug: id,
      title: data.title,
      shortTitle: data.shortTitle,
      level,
      duration: `${data.durationWeeks} ${data.durationWeeks === 1 ? 'week' : 'weeks'}`,
      description: data.description,
      outcome: data.outcome,
      accent: data.accent as Program['accent'],
    },
    order: data.order as number,
  }
}

let publishedProgramsPromise: Promise<Program[]> | null = null

export function loadPublishedPrograms() {
  if (publishedProgramsPromise) return publishedProgramsPromise
  publishedProgramsPromise = (async () => {
    try {
      const services = await getFirebaseFirestore()
      if (!services) return learnerEnrollmentEnabled ? [] : fallbackPrograms
      const { collection, getDocs } = services.firestoreSdk
      const snapshot = await getDocs(collection(services.db, 'publishedPrograms'))
      const records = snapshot.docs
        .map((item) => asProgram(item.id, item.data()))
        .filter((item): item is { program: Program; order: number } => Boolean(item))
        .sort((left, right) => left.order - right.order || left.program.title.localeCompare(right.program.title))
      if (learnerEnrollmentEnabled) return records.map((item) => item.program)
      if (records.length === 0) return fallbackPrograms
      const managedIds = new Set(records.map((item) => item.program.slug))
      return [
        ...records,
        ...fallbackPrograms
          .filter((program) => !managedIds.has(program.slug))
          .map((program, index) => ({ program, order: index + 1 })),
      ]
        .sort((left, right) => left.order - right.order || left.program.title.localeCompare(right.program.title))
        .map((item) => item.program)
    } catch {
      return fallbackPrograms
    }
  })()
  return publishedProgramsPromise
}
