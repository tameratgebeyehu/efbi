import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { getAdminFirebase } from './firebase'
import {
  categoryLabel,
  categoryOptions,
  courseContentMatches,
  emptyCourseForm,
  formFromDraft,
  levelOptions,
  normalizeCourseForm,
  validCourseId,
} from './courseModel'
import type { CourseDraft, CourseFormValues, CourseRelease, CourseStatus } from './courseModel'

type Notice = { kind: 'success' | 'error'; message: string } | null
type CourseRecovery = {
  selectedId: string
  newCourseId: string
  form: CourseFormValues
  baseRevision: number | null
  savedAt: string
}

const recoveryKey = 'efbi-admin-course-recovery-v1'

function readCourseRecovery(): CourseRecovery | null {
  try {
    const raw = localStorage.getItem(recoveryKey)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<CourseRecovery>
    if (typeof value.selectedId !== 'string'
      || (value.selectedId !== 'new' && !validCourseId(value.selectedId))
      || typeof value.newCourseId !== 'string'
      || typeof value.form !== 'object'
      || value.form === null
      || typeof value.savedAt !== 'string') return null
    const candidate = value.form as Partial<CourseFormValues>
    if (typeof candidate.title !== 'string'
      || typeof candidate.summary !== 'string'
      || typeof candidate.description !== 'string'
      || typeof candidate.language !== 'string'
      || typeof candidate.estimatedMinutes !== 'string'
      || !categoryOptions.some((option) => option.value === candidate.category)
      || !levelOptions.includes(candidate.level as CourseFormValues['level'])) return null
    return {
      selectedId: value.selectedId,
      newCourseId: value.newCourseId,
      form: candidate as CourseFormValues,
      baseRevision: typeof value.baseRevision === 'number' ? value.baseRevision : null,
      savedAt: value.savedAt,
    }
  } catch {
    return null
  }
}

function storeCourseRecovery(recovery: CourseRecovery) {
  try {
    localStorage.setItem(recoveryKey, JSON.stringify(recovery))
  } catch {
    // Firestore remains authoritative; recovery storage is best-effort only.
  }
}

function clearCourseRecovery() {
  try {
    localStorage.removeItem(recoveryKey)
  } catch {
    // A blocked local store must not block the course workflow.
  }
}

function safeString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function safeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function asDraft(id: string, data: Record<string, unknown>): CourseDraft {
  const category = safeString(data.category) as CourseDraft['category']
  const level = safeString(data.level) as CourseDraft['level']
  const status = safeString(data.status) as CourseStatus
  return {
    courseId: id,
    title: safeString(data.title),
    summary: safeString(data.summary),
    description: safeString(data.description),
    category,
    level,
    language: safeString(data.language),
    estimatedMinutes: safeNumber(data.estimatedMinutes),
    status,
    revision: safeNumber(data.revision),
    latestReleaseNumber: safeNumber(data.latestReleaseNumber),
    latestReleaseId: safeString(data.latestReleaseId),
    createdAt: data.createdAt,
    createdBy: safeString(data.createdBy),
    updatedAt: data.updatedAt,
    updatedBy: safeString(data.updatedBy),
    lastAuditId: safeString(data.lastAuditId),
  }
}

function asRelease(id: string, data: Record<string, unknown>): CourseRelease {
  return {
    releaseId: id,
    courseId: safeString(data.courseId),
    title: safeString(data.title),
    summary: safeString(data.summary),
    description: safeString(data.description),
    category: safeString(data.category) as CourseRelease['category'],
    level: safeString(data.level) as CourseRelease['level'],
    language: safeString(data.language),
    estimatedMinutes: safeNumber(data.estimatedMinutes),
    version: safeNumber(data.version),
    draftRevision: safeNumber(data.draftRevision),
    publishedAt: data.publishedAt,
    publishedBy: safeString(data.publishedBy),
    auditId: safeString(data.auditId),
  }
}

function readableDate(value: unknown) {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toLocaleString()
  }
  return 'Pending server time'
}

function identifier(prefix: string, courseId: string) {
  const random = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${courseId}-${random}`.slice(0, prefix === 'audit' ? 180 : 120)
}

function auditRecord({
  eventId,
  action,
  entityType,
  entityId,
  actorUid,
  revision,
  releaseId,
  serverTimestamp,
}: {
  eventId: string
  action: 'course.draft.created' | 'course.draft.updated' | 'course.release.published'
  entityType: 'courseDraft' | 'courseRelease'
  entityId: string
  actorUid: string
  revision: number
  releaseId: string
  serverTimestamp: () => unknown
}) {
  return { eventId, action, entityType, entityId, actorUid, revision, releaseId, createdAt: serverTimestamp() }
}

function StatusPill({ status }: { status: CourseStatus }) {
  return <span className={`status-pill status-pill--${status}`}>{status === 'ready' ? 'Review ready' : status}</span>
}

export default function CourseManager({ user }: { user: User }) {
  const [drafts, setDrafts] = useState<CourseDraft[]>([])
  const [releases, setReleases] = useState<CourseRelease[]>([])
  const [selectedId, setSelectedId] = useState<string>('new')
  const [newCourseId, setNewCourseId] = useState('')
  const [form, setForm] = useState<CourseFormValues>({ ...emptyCourseForm })
  const [notice, setNotice] = useState<Notice>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [confirmPublish, setConfirmPublish] = useState(false)
  const [pendingRecovery, setPendingRecovery] = useState<CourseRecovery | null>(() => readCourseRecovery())
  const recoverySelection = useRef<{ courseId: string; baseRevision: number | null } | null>(null)

  const selected = drafts.find((draft) => draft.courseId === selectedId) ?? null
  const normalized = useMemo(() => normalizeCourseForm(form), [form])
  const hasUnsavedChanges = selected ? !courseContentMatches(selected, normalized.content) : true
  const selectedReleases = releases
    .filter((release) => release.courseId === selectedId)
    .sort((left, right) => right.version - left.version)

  useEffect(() => {
    let active = true
    let stopDrafts: () => void = () => undefined
    let stopReleases: () => void = () => undefined
    void getAdminFirebase().then((services) => {
      if (!active || !services) return
      const { collection, onSnapshot } = services.firestoreSdk
      stopDrafts = onSnapshot(collection(services.db, 'courseDrafts'), (snapshot) => {
        if (!active) return
        const next = snapshot.docs
          .map((item) => asDraft(item.id, item.data()))
          .sort((left, right) => left.title.localeCompare(right.title))
        setDrafts(next)
        setLoading(false)
      }, () => {
        if (!active) return
        setNotice({ kind: 'error', message: 'Course drafts could not be loaded. Refresh the session and try again.' })
        setLoading(false)
      })
      stopReleases = onSnapshot(collection(services.db, 'courseReleases'), (snapshot) => {
        if (!active) return
        setReleases(snapshot.docs.map((item) => asRelease(item.id, item.data())))
      }, () => {
        if (active) setNotice({ kind: 'error', message: 'Release history could not be loaded.' })
      })
    }).catch(() => {
      if (active) {
        setNotice({ kind: 'error', message: 'Firebase could not start for the course workspace.' })
        setLoading(false)
      }
    })
    return () => { active = false; stopDrafts(); stopReleases() }
  }, [])

  useEffect(() => {
    if (selected) {
      const recovery = recoverySelection.current
      if (recovery?.courseId === selected.courseId) {
        recoverySelection.current = null
        if (recovery.baseRevision === selected.revision) return
        setNotice({ kind: 'error', message: 'The saved recovery copy is older than the server draft, so the newer server version was kept.' })
      }
      setForm(formFromDraft(selected))
      setConfirmPublish(false)
    }
  }, [selected])

  function chooseDraft(courseId: string) {
    clearCourseRecovery()
    setPendingRecovery(null)
    recoverySelection.current = null
    setSelectedId(courseId)
    setNotice(null)
  }

  function startNew() {
    clearCourseRecovery()
    setPendingRecovery(null)
    recoverySelection.current = null
    setSelectedId('new')
    setNewCourseId('')
    setForm({ ...emptyCourseForm })
    setConfirmPublish(false)
    setNotice(null)
  }

  function updateField<Key extends keyof CourseFormValues>(key: Key, value: CourseFormValues[Key]) {
    setForm((current) => {
      const next = { ...current, [key]: value }
      storeCourseRecovery({
        selectedId,
        newCourseId,
        form: next,
        baseRevision: selected?.revision ?? null,
        savedAt: new Date().toISOString(),
      })
      return next
    })
    setConfirmPublish(false)
  }

  function updateNewCourseId(value: string) {
    const next = value.toLowerCase()
    setNewCourseId(next)
    storeCourseRecovery({ selectedId: 'new', newCourseId: next, form, baseRevision: null, savedAt: new Date().toISOString() })
  }

  function recoverLocalCopy() {
    if (!pendingRecovery) return
    if (pendingRecovery.selectedId !== 'new') {
      const serverDraft = drafts.find((draft) => draft.courseId === pendingRecovery.selectedId)
      if (!serverDraft) {
        setNotice({ kind: 'error', message: 'That recovery copy no longer matches a server draft and was not opened.' })
        return
      }
      if (serverDraft.revision !== pendingRecovery.baseRevision) {
        clearCourseRecovery()
        setPendingRecovery(null)
        setNotice({ kind: 'error', message: 'The server draft changed after this copy was saved, so the newer server version was kept.' })
        return
      }
      recoverySelection.current = { courseId: pendingRecovery.selectedId, baseRevision: pendingRecovery.baseRevision }
    }
    setSelectedId(pendingRecovery.selectedId)
    setNewCourseId(pendingRecovery.newCourseId)
    setForm(pendingRecovery.form)
    setPendingRecovery(null)
    setNotice({ kind: 'success', message: 'The locally saved course text was restored. Review it before saving to Firebase.' })
  }

  function discardLocalCopy() {
    clearCourseRecovery()
    setPendingRecovery(null)
  }

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const courseId = newCourseId.trim()
    if (!validCourseId(courseId)) {
      setNotice({ kind: 'error', message: 'Course ID must use 3–64 lowercase letters, numbers, and single hyphens.' })
      return
    }
    if (drafts.some((draft) => draft.courseId === courseId)) {
      setNotice({ kind: 'error', message: 'That course ID already exists and cannot be reused.' })
      return
    }
    if (normalized.errors.length) {
      setNotice({ kind: 'error', message: normalized.errors[0] })
      return
    }
    setBusy(true)
    setNotice(null)
    try {
      const services = await getAdminFirebase()
      if (!services) throw new Error('Firebase configuration is missing.')
      const { collection, doc, serverTimestamp, writeBatch } = services.firestoreSdk
      const auditId = identifier('audit', courseId)
      const batch = writeBatch(services.db)
      batch.set(doc(collection(services.db, 'courseDrafts'), courseId), {
        courseId,
        ...normalized.content,
        status: 'draft',
        revision: 1,
        latestReleaseNumber: 0,
        latestReleaseId: '',
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        lastAuditId: auditId,
      })
      batch.set(doc(collection(services.db, 'adminAudit'), auditId), auditRecord({
        eventId: auditId,
        action: 'course.draft.created',
        entityType: 'courseDraft',
        entityId: courseId,
        actorUid: user.uid,
        revision: 1,
        releaseId: '',
        serverTimestamp,
      }))
      await batch.commit()
      clearCourseRecovery()
      setPendingRecovery(null)
      setSelectedId(courseId)
      setNotice({ kind: 'success', message: 'Course draft created with an audit record.' })
    } catch {
      setNotice({ kind: 'error', message: 'The draft was not created. No partial change was saved.' })
    } finally {
      setBusy(false)
    }
  }

  async function saveDraft(status: 'draft' | 'ready') {
    if (!selected) return
    if (normalized.errors.length) {
      setNotice({ kind: 'error', message: normalized.errors[0] })
      return
    }
    setBusy(true)
    setNotice(null)
    try {
      const services = await getAdminFirebase()
      if (!services) throw new Error('Firebase configuration is missing.')
      const { collection, doc, serverTimestamp, writeBatch } = services.firestoreSdk
      const revision = selected.revision + 1
      const auditId = identifier('audit', selected.courseId)
      const batch = writeBatch(services.db)
      batch.set(doc(collection(services.db, 'courseDrafts'), selected.courseId), {
        courseId: selected.courseId,
        ...normalized.content,
        status,
        revision,
        latestReleaseNumber: selected.latestReleaseNumber,
        latestReleaseId: selected.latestReleaseId,
        createdAt: selected.createdAt,
        createdBy: selected.createdBy,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        lastAuditId: auditId,
      })
      batch.set(doc(collection(services.db, 'adminAudit'), auditId), auditRecord({
        eventId: auditId,
        action: 'course.draft.updated',
        entityType: 'courseDraft',
        entityId: selected.courseId,
        actorUid: user.uid,
        revision,
        releaseId: selected.latestReleaseId,
        serverTimestamp,
      }))
      await batch.commit()
      clearCourseRecovery()
      setPendingRecovery(null)
      setNotice({
        kind: 'success',
        message: status === 'ready' ? 'Draft marked review ready.' : 'Draft saved with an audit record.',
      })
    } catch {
      setNotice({ kind: 'error', message: 'The draft was not saved. No partial change was written.' })
    } finally {
      setBusy(false)
    }
  }

  async function publish() {
    if (!selected || selected.status !== 'ready' || hasUnsavedChanges || normalized.errors.length) return
    setBusy(true)
    setNotice(null)
    try {
      const services = await getAdminFirebase()
      if (!services) throw new Error('Firebase configuration is missing.')
      const { collection, doc, serverTimestamp, writeBatch } = services.firestoreSdk
      const revision = selected.revision + 1
      const version = selected.latestReleaseNumber + 1
      const releaseId = identifier('release', selected.courseId)
      const auditId = identifier('audit', selected.courseId)
      const batch = writeBatch(services.db)
      batch.set(doc(collection(services.db, 'courseDrafts'), selected.courseId), {
        courseId: selected.courseId,
        ...normalized.content,
        status: 'published',
        revision,
        latestReleaseNumber: version,
        latestReleaseId: releaseId,
        createdAt: selected.createdAt,
        createdBy: selected.createdBy,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        lastAuditId: auditId,
      })
      batch.set(doc(collection(services.db, 'courseReleases'), releaseId), {
        releaseId,
        courseId: selected.courseId,
        ...normalized.content,
        version,
        draftRevision: revision,
        publishedAt: serverTimestamp(),
        publishedBy: user.uid,
        auditId,
      })
      batch.set(doc(collection(services.db, 'adminAudit'), auditId), auditRecord({
        eventId: auditId,
        action: 'course.release.published',
        entityType: 'courseRelease',
        entityId: selected.courseId,
        actorUid: user.uid,
        revision,
        releaseId,
        serverTimestamp,
      }))
      await batch.commit()
      clearCourseRecovery()
      setPendingRecovery(null)
      setConfirmPublish(false)
      setNotice({ kind: 'success', message: `Release ${version} published as an immutable snapshot.` })
    } catch {
      setNotice({ kind: 'error', message: 'Publishing failed safely. The draft, release, and audit were not partially written.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="course-workspace">
      <header className="workspace-title">
        <div><p className="eyebrow">Phase 10 · Course management</p><h1>Course workspace</h1><p>Create clear course records, review them, and publish immutable releases.</p></div>
        <button className="primary-action" onClick={startNew}>New course</button>
      </header>

      {notice && <div className={`notice notice--${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.message}</div>}
      {pendingRecovery && <div className="recovery-notice"><div><strong>Unsaved course text found</strong><p>A local recovery copy from {new Date(pendingRecovery.savedAt).toLocaleString()} is available after an interrupted session.</p></div><div><button type="button" onClick={discardLocalCopy}>Discard</button><button className="primary-action" type="button" onClick={recoverLocalCopy} disabled={loading}>Restore copy</button></div></div>}

      <div className="course-layout">
        <aside className="course-list" aria-label="Course drafts">
          <div className="course-list__heading"><strong>Draft library</strong><span>{drafts.length}</span></div>
          {loading && <p className="empty-list">Loading drafts…</p>}
          {!loading && drafts.length === 0 && <p className="empty-list">No drafts yet. Create the first course.</p>}
          {drafts.map((draft) => (
            <button className={selectedId === draft.courseId ? 'selected' : ''} key={draft.courseId} onClick={() => chooseDraft(draft.courseId)}>
              <span><strong>{draft.title}</strong><small>{draft.courseId}</small></span>
              <StatusPill status={draft.status} />
            </button>
          ))}
        </aside>

        <form className="course-editor" onSubmit={createDraft}>
          <div className="editor-heading">
            <div><p className="eyebrow">{selected ? `Revision ${selected.revision}` : 'New draft'}</p><h2>{selected ? selected.title : 'Create a course'}</h2></div>
            {selected && <StatusPill status={selected.status} />}
          </div>

          {!selected && <label>Course ID<span>Permanent lowercase slug. It cannot be renamed later.</span><input value={newCourseId} onChange={(event) => updateNewCourseId(event.target.value)} placeholder="example-course-name" minLength={3} maxLength={64} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label>}
          <label>Course title<span>5–100 characters</span><input value={form.title} onChange={(event) => updateField('title', event.target.value)} minLength={5} maxLength={100} required /></label>
          <label>Short summary<span>{form.summary.length}/240 · shown in course listings</span><textarea className="textarea--short" value={form.summary} onChange={(event) => updateField('summary', event.target.value)} minLength={20} maxLength={240} required /></label>
          <label>Full description<span>{form.description.length}/4000 · explain the learner outcome</span><textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} minLength={40} maxLength={4000} required /></label>
          <div className="field-grid">
            <label>Program category<select value={form.category} onChange={(event) => updateField('category', event.target.value as CourseFormValues['category'])}>{categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label>Level<select value={form.level} onChange={(event) => updateField('level', event.target.value as CourseFormValues['level'])}>{levelOptions.map((level) => <option key={level} value={level}>{level[0].toUpperCase() + level.slice(1)}</option>)}</select></label>
            <label>Language<input value={form.language} onChange={(event) => updateField('language', event.target.value)} minLength={2} maxLength={40} required /></label>
            <label>Learning time (minutes)<input type="number" value={form.estimatedMinutes} onChange={(event) => updateField('estimatedMinutes', event.target.value)} min={15} max={20000} step={1} required /></label>
          </div>

          {normalized.errors.length > 0 && <div className="validation-list"><strong>Before saving</strong><ul>{normalized.errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}

          <div className="editor-actions">
            {!selected && <button className="primary-action" type="submit" disabled={busy || normalized.errors.length > 0}>{busy ? 'Creating…' : 'Create draft'}</button>}
            {selected && <><button type="button" onClick={() => void saveDraft('draft')} disabled={busy || normalized.errors.length > 0 || (selected.status === 'draft' && !hasUnsavedChanges) || (selected.status === 'published' && !hasUnsavedChanges)}>{selected.status === 'published' ? 'Save as new draft' : 'Save draft'}</button><button className="primary-action" type="button" onClick={() => void saveDraft('ready')} disabled={busy || normalized.errors.length > 0 || (selected.status === 'ready' && !hasUnsavedChanges) || (selected.status === 'published' && !hasUnsavedChanges)}>Mark review ready</button></>}
          </div>
        </form>

        <aside className="course-preview">
          <p className="eyebrow">Safe preview</p>
          <div className="preview-card">
            <span className="preview-category">{categoryLabel(form.category)}</span>
            <h2>{normalized.content.title || 'Course title'}</h2>
            <p>{normalized.content.summary || 'A short course summary will appear here.'}</p>
            <div className="preview-meta"><span>{form.level}</span><span>{form.language || 'Language'}</span><span>{normalized.content.estimatedMinutes || 0} min</span></div>
            <div className="preview-description">{normalized.content.description || 'The full course description will appear here.'}</div>
          </div>

          {selected && <div className="release-panel">
            <div className="release-panel__heading"><strong>Release history</strong><span>{selectedReleases.length}</span></div>
            {selectedReleases.length === 0 && <p>No releases published.</p>}
            {selectedReleases.map((release) => <article key={release.releaseId}><span>Release {release.version}</span><small>{readableDate(release.publishedAt)}</small></article>)}
          </div>}

          {selected?.status === 'ready' && <div className="publish-panel">
            <strong>Ready to publish</strong>
            <p>Publishing creates an immutable release. This draft cannot change during the publish transaction.</p>
            {hasUnsavedChanges && <p className="publish-warning">Save or discard the unsaved edits before publishing.</p>}
            {!hasUnsavedChanges && <label className="confirm-check"><input type="checkbox" checked={confirmPublish} onChange={(event) => setConfirmPublish(event.target.checked)} />I reviewed this exact preview and want to publish it.</label>}
            <button className="publish-action" type="button" disabled={busy || hasUnsavedChanges || !confirmPublish} onClick={() => void publish()}>{busy ? 'Publishing…' : `Publish release ${selected.latestReleaseNumber + 1}`}</button>
          </div>}
        </aside>
      </div>
    </section>
  )
}
