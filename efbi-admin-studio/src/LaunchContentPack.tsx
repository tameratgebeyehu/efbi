import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import type { User } from 'firebase/auth'
import launchPackRaw from '../../academy-v2/content/launch-pack-v1.json?raw'
import { getAdminFirebase } from './firebase'
import { normalizeProgramForm, type ProgramContent } from './programModel'
import { normalizeCourseForm, type CourseContent } from './courseModel'
import { normalizeLessonForm, type LessonContent } from './lessonModel'
import { normalizeBlogForm, type BlogContent } from './blogModel'

type ProgramItem = ProgramContent & { programId: string }
type CourseItem = CourseContent & { courseId: string }
type LessonItem = LessonContent
type ArticleItem = BlogContent & { postId: string }
type LaunchPack = {
  packId: string
  title: string
  reviewStatus: string
  programs: ProgramItem[]
  courses: CourseItem[]
  lessons: LessonItem[]
  articles: ArticleItem[]
}
type PackRecord = {
  key: string
  collection: 'programDrafts' | 'courseDrafts' | 'lessonDrafts' | 'blogDrafts'
  id: string
  kind: string
  title: string
  item: ProgramItem | CourseItem | LessonItem | ArticleItem
}

const pack = JSON.parse(launchPackRaw) as LaunchPack
const confirmationPhrase = 'IMPORT LAUNCH DRAFTS'

function validatePack() {
  const errors: string[] = []
  if (pack.packId !== 'efbi-launch-pack-v1') errors.push('The pack identity is not recognized.')
  if (pack.reviewStatus !== 'owner-review-required') errors.push('The pack must require owner review.')
  if (pack.programs.length !== 4) errors.push('The launch pack must contain the four approved programs.')
  if (pack.courses.length !== 1) errors.push('The first pack must contain one pilot course.')
  if (pack.lessons.length < 1) errors.push('The pilot course needs at least one lesson.')
  if (pack.articles.length < 1) errors.push('The launch pack needs at least one article.')

  for (const item of pack.programs) {
    const result = normalizeProgramForm({ ...item, durationWeeks: String(item.durationWeeks), order: String(item.order) })
    errors.push(...result.errors.map((error) => `${item.programId}: ${error}`))
  }
  for (const item of pack.courses) {
    const result = normalizeCourseForm({ ...item, estimatedMinutes: String(item.estimatedMinutes) })
    errors.push(...result.errors.map((error) => `${item.courseId}: ${error}`))
  }
  for (const item of pack.lessons) {
    const result = normalizeLessonForm({ ...item, order: String(item.order), durationMinutes: String(item.durationMinutes) })
    errors.push(...result.errors.map((error) => `${item.lessonId}: ${error}`))
    if (!pack.courses.some((course) => course.courseId === item.courseId)) errors.push(`${item.lessonId}: parent course is missing.`)
  }
  for (const item of pack.articles) {
    const result = normalizeBlogForm({ ...item, readingMinutes: String(item.readingMinutes) })
    errors.push(...result.errors.map((error) => `${item.postId}: ${error}`))
  }

  const ids = [...pack.programs.map((item) => item.programId), ...pack.courses.map((item) => item.courseId), ...pack.lessons.map((item) => item.lessonId), ...pack.articles.map((item) => item.postId)]
  if (new Set(ids).size !== ids.length) errors.push('Every launch content ID must be unique.')
  const lessonMinutes = pack.lessons.reduce((total, lesson) => total + lesson.durationMinutes, 0)
  if (pack.courses[0]?.estimatedMinutes !== lessonMinutes) errors.push('Pilot course time must equal its lesson time.')
  return errors
}

const validationErrors = validatePack()
const records: PackRecord[] = [
  ...pack.programs.map((item) => ({ key: `programDrafts/${item.programId}`, collection: 'programDrafts' as const, id: item.programId, kind: 'Program', title: item.title, item })),
  ...pack.courses.map((item) => ({ key: `courseDrafts/${item.courseId}`, collection: 'courseDrafts' as const, id: item.courseId, kind: 'Course', title: item.title, item })),
  ...pack.lessons.map((item) => ({ key: `lessonDrafts/${item.lessonId}`, collection: 'lessonDrafts' as const, id: item.lessonId, kind: 'Lesson', title: item.title, item })),
  ...pack.articles.map((item) => ({ key: `blogDrafts/${item.postId}`, collection: 'blogDrafts' as const, id: item.postId, kind: 'Article', title: item.title, item })),
]

function identifier(id: string) {
  const random = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return `audit-${id}-${random}`.slice(0, 180)
}

export default function LaunchContentPack({ user }: { user: User }) {
  const [existing, setExisting] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [phrase, setPhrase] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const services = await getAdminFirebase()
      if (!services) throw new Error('Firebase configuration is missing.')
      const snapshots = await Promise.all(records.map((record) => services.firestoreSdk.getDoc(services.firestoreSdk.doc(services.db, record.collection, record.id))))
      setExisting(new Set(records.filter((_, index) => snapshots[index].exists()).map((record) => record.key)))
    } catch {
      setNotice({ kind: 'error', message: 'The launch draft inventory could not be loaded.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const missing = useMemo(() => records.filter((record) => !existing.has(record.key)), [existing])

  async function importDrafts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (validationErrors.length || phrase !== confirmationPhrase || !confirmed || missing.length === 0) return
    setBusy(true)
    setNotice(null)
    let created = 0
    try {
      const services = await getAdminFirebase()
      if (!services) throw new Error('Firebase configuration is missing.')
      const { doc, getDoc, serverTimestamp, writeBatch } = services.firestoreSdk

      for (const record of records) {
        const reference = doc(services.db, record.collection, record.id)
        if ((await getDoc(reference)).exists()) continue
        const auditId = identifier(record.id)
        const audit = {
          eventId: auditId,
          action: record.collection === 'programDrafts' ? 'program.draft.created'
            : record.collection === 'courseDrafts' ? 'course.draft.created'
              : record.collection === 'lessonDrafts' ? 'lesson.draft.created'
                : 'blog.draft.created',
          entityType: record.collection.slice(0, -1),
          entityId: record.id,
          actorUid: user.uid,
          revision: 1,
          releaseId: '',
          createdAt: serverTimestamp(),
        }
        const common = {
          status: 'draft',
          revision: 1,
          latestReleaseNumber: 0,
          latestReleaseId: '',
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
          lastAuditId: auditId,
        }
        const batch = writeBatch(services.db)
        batch.set(reference, { ...record.item, ...common })
        batch.set(doc(services.db, 'adminAudit', auditId), audit)
        await batch.commit()
        created += 1
      }

      setPhrase('')
      setConfirmed(false)
      await refresh()
      setNotice({ kind: 'success', message: created ? `${created} audited launch drafts were imported. Review every item before marking it ready.` : 'Every launch draft already exists. Nothing was overwritten.' })
    } catch {
      await refresh()
      setNotice({ kind: 'error', message: `Import stopped safely after ${created} item${created === 1 ? '' : 's'}. Existing drafts were not overwritten; review them and rerun to import only missing items.` })
    } finally {
      setBusy(false)
    }
  }

  return <section className="launch-pack-workspace">
    <header className="workspace-title"><div><p className="eyebrow">Phase 27 · Owner review</p><h1>Launch content drafts</h1><p>Bring the four EFBI programs, first AI course, four lessons, twelve practice questions, and first article into the protected review workflow.</p></div><span className="security-badge">Drafts only</span></header>
    {notice && <div className={`notice notice--${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.message}</div>}
    {validationErrors.length > 0 && <div className="notice notice--error" role="alert"><strong>Pack validation failed.</strong><ul>{validationErrors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
    <aside className="launch-pack-boundary"><strong>Nothing is published by this action.</strong><p>Each missing item is created as a private revision-one draft with its own immutable audit event. Existing IDs are skipped, so interruption is recoverable and no saved content is overwritten.</p></aside>
    <section className="launch-pack-summary" aria-label="Launch draft pack summary">
      <article><small>Programs</small><strong>{pack.programs.length}</strong></article>
      <article><small>Course</small><strong>{pack.courses.length}</strong></article>
      <article><small>Lessons</small><strong>{pack.lessons.length}</strong></article>
      <article><small>Practice questions</small><strong>{pack.lessons.reduce((total, lesson) => total + lesson.questions.length, 0)}</strong></article>
      <article><small>Article</small><strong>{pack.articles.length}</strong></article>
    </section>
    <section className="launch-pack-list"><div><p className="eyebrow">Pack inventory</p><h2>{pack.title}</h2><p>Open each imported draft in its normal workspace, use the full preview, edit anything that does not sound like EFBI, and publish only after approval.</p></div><ul>{records.map((record) => <li key={record.key}><span>{record.kind}</span><div><strong>{record.title}</strong><small>{record.id}</small></div><b className={existing.has(record.key) ? 'is-imported' : ''}>{loading ? 'Checking' : existing.has(record.key) ? 'In Studio' : 'Ready to import'}</b></li>)}</ul></section>
    <form className="launch-pack-action" onSubmit={(event) => void importDrafts(event)}>
      <div><p className="eyebrow">Protected import</p><h2>Import missing drafts</h2><p>This can be rerun safely. It creates only IDs that do not already exist.</p></div>
      <label>Type {confirmationPhrase}<input value={phrase} onChange={(event) => { setPhrase(event.target.value); setConfirmed(false) }} autoComplete="off" /></label>
      <label className="confirm-check"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>I understand these are draft words and questions that need my review before publication.</span></label>
      <button className="primary-action" disabled={busy || loading || validationErrors.length > 0 || phrase !== confirmationPhrase || !confirmed || missing.length === 0}>{busy ? 'Importing safely…' : missing.length === 0 ? 'All drafts imported' : `Import ${missing.length} missing drafts`}</button>
    </form>
  </section>
}
