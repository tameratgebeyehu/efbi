export const programLevelOptions = ['beginner', 'intermediate', 'advanced'] as const
export const programAccentOptions = ['green', 'gold', 'blue', 'red'] as const

export type ProgramLevel = typeof programLevelOptions[number]
export type ProgramAccent = typeof programAccentOptions[number]
export type ProgramStatus = 'draft' | 'ready' | 'published'

export type ProgramFormValues = {
  title: string
  shortTitle: string
  description: string
  outcome: string
  level: ProgramLevel
  durationWeeks: string
  accent: ProgramAccent
  order: string
}

export type ProgramContent = Omit<ProgramFormValues, 'durationWeeks' | 'order'> & {
  durationWeeks: number
  order: number
}

export type ProgramDraft = ProgramContent & {
  programId: string
  status: ProgramStatus
  revision: number
  latestReleaseNumber: number
  latestReleaseId: string
  createdAt: unknown
  createdBy: string
  updatedAt: unknown
  updatedBy: string
  lastAuditId: string
}

export type ProgramRelease = ProgramContent & {
  releaseId: string
  programId: string
  version: number
  draftRevision: number
  publishedAt: unknown
  publishedBy: string
  auditId: string
}

export const emptyProgramForm: ProgramFormValues = {
  title: '',
  shortTitle: '',
  description: '',
  outcome: '',
  level: 'beginner',
  durationWeeks: '6',
  accent: 'green',
  order: '1',
}

export function validProgramId(value: string) {
  return value.length >= 3
    && value.length <= 64
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}

export function normalizeProgramForm(values: ProgramFormValues) {
  const content: ProgramContent = {
    title: values.title.trim(),
    shortTitle: values.shortTitle.trim(),
    description: values.description.trim(),
    outcome: values.outcome.trim(),
    level: values.level,
    durationWeeks: Number(values.durationWeeks),
    accent: values.accent,
    order: Number(values.order),
  }
  const errors: string[] = []
  if (content.title.length < 3 || content.title.length > 80) errors.push('Program title must be 3–80 characters.')
  if (content.shortTitle.length < 2 || content.shortTitle.length > 16) errors.push('Short title must be 2–16 characters.')
  if (content.description.length < 20 || content.description.length > 500) errors.push('Description must be 20–500 characters.')
  if (content.outcome.length < 20 || content.outcome.length > 300) errors.push('Outcome must be 20–300 characters.')
  if (!programLevelOptions.includes(content.level)) errors.push('Choose a supported program level.')
  if (!programAccentOptions.includes(content.accent)) errors.push('Choose a supported accent color.')
  if (!Number.isInteger(content.durationWeeks) || content.durationWeeks < 1 || content.durationWeeks > 52) errors.push('Duration must be 1–52 weeks.')
  if (!Number.isInteger(content.order) || content.order < 1 || content.order > 50) errors.push('Display order must be 1–50.')
  return { content, errors }
}

export function formFromProgram(draft: ProgramDraft): ProgramFormValues {
  return {
    title: draft.title,
    shortTitle: draft.shortTitle,
    description: draft.description,
    outcome: draft.outcome,
    level: draft.level,
    durationWeeks: String(draft.durationWeeks),
    accent: draft.accent,
    order: String(draft.order),
  }
}

export function programContentMatches(draft: ProgramDraft, content: ProgramContent) {
  return draft.title === content.title
    && draft.shortTitle === content.shortTitle
    && draft.description === content.description
    && draft.outcome === content.outcome
    && draft.level === content.level
    && draft.durationWeeks === content.durationWeeks
    && draft.accent === content.accent
    && draft.order === content.order
}
