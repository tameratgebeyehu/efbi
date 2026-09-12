export const requestTargetDays = 14
export const holdReviewDays = 30

export type RetentionAttention = {
  kind: 'normal' | 'due' | 'overdue' | 'complete'
  label: string
  detail: string
  priority: number
}

function toDate(value: unknown) {
  if (value instanceof Date) return value
  if (!value || typeof value !== 'object') return null
  const timestamp = value as { toDate?: () => Date }
  return typeof timestamp.toDate === 'function' ? timestamp.toDate() : null
}

function wholeDaysSince(value: unknown, now: Date) {
  const date = toDate(value)
  if (!date) return 0
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000))
}

export function retentionAttention(
  record: { status: string; updatedAt: unknown; hold: { status: string; updatedAt: unknown } | null; authenticationRemoved: boolean },
  now = new Date(),
): RetentionAttention {
  if (record.status === 'completed') {
    return record.authenticationRemoved
      ? { kind: 'complete', label: 'Fully closed', detail: 'Firestore and Authentication steps are recorded.', priority: 0 }
      : { kind: 'overdue', label: 'Authentication pending', detail: 'Delete the exact UID in Firebase Authentication, then record confirmation.', priority: 5 }
  }
  if (record.status === 'cancelled') {
    return { kind: 'complete', label: 'No action', detail: 'The learner cancelled this request.', priority: 0 }
  }
  if (record.status === 'held' && record.hold?.status === 'active') {
    const age = wholeDaysSince(record.hold.updatedAt, now)
    const remaining = Math.max(0, holdReviewDays - age)
    if (age >= holdReviewDays) return { kind: 'overdue', label: 'Hold review overdue', detail: 'The 30-day internal hold review is due now.', priority: 4 }
    if (remaining <= 7) return { kind: 'due', label: 'Hold review soon', detail: 'Review this hold within ' + remaining + (remaining === 1 ? ' day.' : ' days.'), priority: 3 }
    return { kind: 'normal', label: 'Hold active', detail: 'Next internal review is due in ' + remaining + ' days.', priority: 1 }
  }
  const age = wholeDaysSince(record.updatedAt, now)
  const remaining = Math.max(0, requestTargetDays - age)
  if (age >= requestTargetDays) return { kind: 'overdue', label: 'Internal target missed', detail: 'This request has waited ' + age + ' days since its latest activation.', priority: 4 }
  if (remaining <= 3) return { kind: 'due', label: 'Response due soon', detail: 'Act within ' + remaining + (remaining === 1 ? ' day.' : ' days.'), priority: 3 }
  return { kind: 'normal', label: 'In target', detail: 'Internal response target: ' + remaining + ' days remaining.', priority: 2 }
}
