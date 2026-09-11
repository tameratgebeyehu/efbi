import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { getAdminFirebase } from './firebase'
import type { CourseDraft } from './courseModel'
import {
  emptyLessonForm,
  formFromLesson,
  lessonContentMatches,
  normalizeLessonForm,
  validLessonId,
} from './lessonModel'
import type { LessonDraft, LessonFormValues, LessonRelease, LessonStatus, PracticeQuestion } from './lessonModel'

type Notice = { kind: 'success' | 'error'; message: string } | null
type LessonRecovery = {
  selectedId: string
  form: LessonFormValues
  baseRevision: number | null
  savedAt: string
}

const recoveryKey = 'efbi-admin-lesson-recovery-v1'

function safeString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function safeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function safeQuestion(value: unknown): PracticeQuestion {
  if (!value || typeof value !== 'object') return { enabled: false, prompt: '', options: ['', '', ''], correctOption: 0, explanation: '' }
  const candidate = value as Record<string, unknown>
  const options = Array.isArray(candidate.options) ? candidate.options.map(safeString) : []
  return {
    enabled: candidate.enabled === true,
    prompt: safeString(candidate.prompt),
    options: [options[0] ?? '', options[1] ?? '', options[2] ?? ''],
    correctOption: safeNumber(candidate.correctOption),
    explanation: safeString(candidate.explanation),
  }
}

function asCourseDraft(id: string, data: Record<string, unknown>): CourseDraft {
  return {
    courseId: id,
    title: safeString(data.title),
    summary: safeString(data.summary),
    description: safeString(data.description),
    category: safeString(data.category) as CourseDraft['category'],
    level: safeString(data.level) as CourseDraft['level'],
    language: safeString(data.language),
    estimatedMinutes: safeNumber(data.estimatedMinutes),
    status: safeString(data.status) as CourseDraft['status'],
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

function asLessonDraft(id: string, data: Record<string, unknown>): LessonDraft {
  return {
    lessonId: id,
    courseId: safeString(data.courseId),
    order: safeNumber(data.order),
    title: safeString(data.title),
    summary: safeString(data.summary),
    durationMinutes: safeNumber(data.durationMinutes),
    videoYoutubeId: safeString(data.videoYoutubeId),
    bodyMarkdown: safeString(data.bodyMarkdown),
    question1: safeQuestion(data.question1),
    question2: safeQuestion(data.question2),
    question3: safeQuestion(data.question3),
    status: safeString(data.status) as LessonStatus,
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


function asLessonRelease(id: string, data: Record<string, unknown>): LessonRelease {
  return {
    releaseId: id,
    lessonId: safeString(data.lessonId),
    courseId: safeString(data.courseId),
    order: safeNumber(data.order),
    title: safeString(data.title),
    summary: safeString(data.summary),
    durationMinutes: safeNumber(data.durationMinutes),
    videoYoutubeId: safeString(data.videoYoutubeId),
    bodyMarkdown: safeString(data.bodyMarkdown),
    question1: safeQuestion(data.question1),
    question2: safeQuestion(data.question2),
    question3: safeQuestion(data.question3),
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
function readRecovery(): LessonRecovery | null {
  try {
    const raw = localStorage.getItem(recoveryKey)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<LessonRecovery>
    if (typeof value.selectedId !== 'string' || typeof value.savedAt !== 'string' || typeof value.form !== 'object' || value.form === null) return null
    if (value.selectedId !== 'new' && !validLessonId(value.selectedId)) return null
    return { selectedId: value.selectedId, form: value.form as LessonFormValues, baseRevision: typeof value.baseRevision === 'number' ? value.baseRevision : null, savedAt: value.savedAt }
  } catch {
    return null
  }
}

function storeRecovery(recovery: LessonRecovery) {
  try { localStorage.setItem(recoveryKey, JSON.stringify(recovery)) } catch { /* Firestore remains authoritative. */ }
}

function clearRecovery() {
  try { localStorage.removeItem(recoveryKey) } catch { /* Ignore unavailable browser storage. */ }
}

function identifier(prefix: string, lessonId: string) {
  const random = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${lessonId}-${random}`.slice(0, 180)
}

function StatusPill({ status }: { status: LessonStatus }) {
  return <span className={`status-pill status-pill--${status}`}>{status === 'ready' ? 'Review ready' : status}</span>
}

function QuestionEditor({ label, question, onChange }: { label: string; question: PracticeQuestion; onChange: (question: PracticeQuestion) => void }) {
  function updateOption(index: number, value: string) {
    const options: [string, string, string] = [...question.options] as [string, string, string]
    options[index] = value
    onChange({ ...question, options })
  }


  return (
    <fieldset className="question-editor">
      <legend><label><input type="checkbox" checked={question.enabled} onChange={(event) => onChange({ ...question, enabled: event.target.checked })} />{label}</label></legend>
      <label>Question prompt<input value={question.prompt} onChange={(event) => onChange({ ...question, prompt: event.target.value })} disabled={!question.enabled} maxLength={240} /></label>
      <div className="field-grid">
        {question.options.map((option, index) => <label key={index}>Option {index + 1}<input value={option} onChange={(event) => updateOption(index, event.target.value)} disabled={!question.enabled} maxLength={160} /></label>)}
      </div>
      <div className="field-grid">
        <label>Correct answer<select value={question.correctOption} onChange={(event) => onChange({ ...question, correctOption: Number(event.target.value) })} disabled={!question.enabled}><option value={0}>Option 1</option><option value={1}>Option 2</option><option value={2}>Option 3</option></select></label>
        <label>Short explanation<input value={question.explanation} onChange={(event) => onChange({ ...question, explanation: event.target.value })} disabled={!question.enabled} maxLength={300} /></label>
      </div>
    </fieldset>
  )
}

export default function LessonManager({ user }: { user: User }) {
  const [courses, setCourses] = useState<CourseDraft[]>([])
  const [lessons, setLessons] = useState<LessonDraft[]>([])
  const [releases, setReleases] = useState<LessonRelease[]>([])
  const [selectedId, setSelectedId] = useState('new')
  const [form, setForm] = useState<LessonFormValues>({ ...emptyLessonForm })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [confirmPublish, setConfirmPublish] = useState(false)
  const [pendingRecovery, setPendingRecovery] = useState<LessonRecovery | null>(() => readRecovery())
  const recoverySelection = useRef<{ lessonId: string; baseRevision: number | null } | null>(null)

  const selected = lessons.find((lesson) => lesson.lessonId === selectedId) ?? null
  const normalized = useMemo(() => normalizeLessonForm(form), [form])
  const hasUnsavedChanges = selected ? !lessonContentMatches(selected, normalized.content) : true
  const filteredLessons = lessons.filter((lesson) => !form.courseId || lesson.courseId === form.courseId).sort((left, right) => left.order - right.order || left.title.localeCompare(right.title))
  const selectedReleases = releases.filter((release) => release.lessonId === selectedId).sort((left, right) => right.version - left.version)

  useEffect(() => {
    let active = true
    let stopCourses: () => void = () => undefined
    let stopLessons: () => void = () => undefined
    let stopReleases: () => void = () => undefined
    void getAdminFirebase().then((services) => {
      if (!active || !services) return
      const { collection, onSnapshot } = services.firestoreSdk
      stopCourses = onSnapshot(collection(services.db, 'courseDrafts'), (snapshot) => {
        if (!active) return
        const next = snapshot.docs.map((item) => asCourseDraft(item.id, item.data())).sort((left, right) => left.title.localeCompare(right.title))
        setCourses(next)
        setLoading(false)
        if (!form.courseId && next[0]) setForm((current) => ({ ...current, courseId: next[0].courseId }))
      }, () => { if (active) { setNotice({ kind: 'error', message: 'Courses could not be loaded.' }); setLoading(false) } })
      stopLessons = onSnapshot(collection(services.db, 'lessonDrafts'), (snapshot) => {
        if (!active) return
        setLessons(snapshot.docs.map((item) => asLessonDraft(item.id, item.data())))
      }, () => { if (active) setNotice({ kind: 'error', message: 'Lesson drafts could not be loaded.' }) })
      stopReleases = onSnapshot(collection(services.db, 'lessonReleases'), (snapshot) => {
        if (!active) return
        setReleases(snapshot.docs.map((item) => asLessonRelease(item.id, item.data())))
      }, () => { if (active) setNotice({ kind: 'error', message: 'Lesson release history could not be loaded.' }) })
    }).catch(() => { if (active) { setNotice({ kind: 'error', message: 'Firebase could not start for lessons.' }); setLoading(false) } })
    return () => { active = false; stopCourses(); stopLessons(); stopReleases() }
  }, [])

  useEffect(() => {
    if (!selected) return
    const recovery = recoverySelection.current
    if (recovery?.lessonId === selected.lessonId) {
      recoverySelection.current = null
      if (recovery.baseRevision === selected.revision) return
      setNotice({ kind: 'error', message: 'The lesson recovery copy is older than the server draft, so the newer server version was kept.' })
    }
    setForm(formFromLesson(selected))
  }, [selected])

  function updateField<Key extends keyof LessonFormValues>(key: Key, value: LessonFormValues[Key]) {
    setConfirmPublish(false)
    setForm((current) => {
      const next = { ...current, [key]: value }
      storeRecovery({ selectedId, form: next, baseRevision: selected?.revision ?? null, savedAt: new Date().toISOString() })
      return next
    })
  }

  function chooseLesson(lessonId: string) {
    clearRecovery()
    setPendingRecovery(null)
    recoverySelection.current = null
    setSelectedId(lessonId)
    setConfirmPublish(false)
    setNotice(null)
  }

  function startNew() {
    clearRecovery()
    setPendingRecovery(null)
    recoverySelection.current = null
    const courseId = form.courseId || courses[0]?.courseId || ''
    setSelectedId('new')
    setConfirmPublish(false)
    setForm({ ...emptyLessonForm, courseId, order: String(filteredLessons.length + 1) })
    setNotice(null)
  }

  function recoverLocalCopy() {
    if (!pendingRecovery) return
    if (pendingRecovery.selectedId !== 'new') {
      const serverLesson = lessons.find((lesson) => lesson.lessonId === pendingRecovery.selectedId)
      if (!serverLesson || serverLesson.revision !== pendingRecovery.baseRevision) {
        clearRecovery()
        setPendingRecovery(null)
        setNotice({ kind: 'error', message: 'The server lesson changed after this copy was saved, so the recovery copy was not opened.' })
        return
      }
      recoverySelection.current = { lessonId: pendingRecovery.selectedId, baseRevision: pendingRecovery.baseRevision }
    }
    setSelectedId(pendingRecovery.selectedId)
    setConfirmPublish(false)
    setForm(pendingRecovery.form)
    setPendingRecovery(null)
    setNotice({ kind: 'success', message: 'The locally saved lesson text was restored. Review it before saving.' })
  }

  function discardLocalCopy() {
    clearRecovery()
    setPendingRecovery(null)
  }

  async function saveLesson(event?: FormEvent<HTMLFormElement>, status: LessonStatus = 'draft') {
    event?.preventDefault()
    if (normalized.errors.length) {
      setNotice({ kind: 'error', message: normalized.errors[0] })
      return
    }
    if (selectedId === 'new' && lessons.some((lesson) => lesson.lessonId === normalized.content.lessonId)) {
      setNotice({ kind: 'error', message: 'That lesson ID already exists and cannot be reused.' })
      return
    }
    if (selected && selected.status === status && !hasUnsavedChanges) return

    setBusy(true)
    setNotice(null)
    try {
      const services = await getAdminFirebase()
      if (!services) throw new Error('Firebase configuration is missing.')
      const { collection, doc, serverTimestamp, writeBatch } = services.firestoreSdk
      const creating = selectedId === 'new'
      const revision = creating ? 1 : selected!.revision + 1
      const lessonId = creating ? normalized.content.lessonId : selected!.lessonId
      const auditId = identifier('audit', lessonId)
      const batch = writeBatch(services.db)
      batch.set(doc(collection(services.db, 'lessonDrafts'), lessonId), {
        ...normalized.content,
        lessonId,
        status,
        revision,
        latestReleaseNumber: creating ? 0 : selected!.latestReleaseNumber,
        latestReleaseId: creating ? '' : selected!.latestReleaseId,
        createdAt: creating ? serverTimestamp() : selected!.createdAt,
        createdBy: creating ? user.uid : selected!.createdBy,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        lastAuditId: auditId,
      })
      batch.set(doc(collection(services.db, 'adminAudit'), auditId), {
        eventId: auditId,
        action: creating ? 'lesson.draft.created' : 'lesson.draft.updated',
        entityType: 'lessonDraft',
        entityId: lessonId,
        actorUid: user.uid,
        revision,
        releaseId: '',
        createdAt: serverTimestamp(),
      })
      await batch.commit()
      clearRecovery()
      setPendingRecovery(null)
      setSelectedId(lessonId)
      setNotice({ kind: 'success', message: status === 'ready' ? 'Lesson marked review ready with an audit record.' : 'Lesson draft saved with an audit record.' })
    } catch {
      setNotice({ kind: 'error', message: 'The lesson was not saved. No partial change was written.' })
    } finally {
      setBusy(false)
    }
  }


  async function publishLesson() {
    if (!selected || selected.status !== 'ready' || hasUnsavedChanges || normalized.errors.length || !confirmPublish) return
    setBusy(true)
    setNotice(null)
    try {
      const services = await getAdminFirebase()
      if (!services) throw new Error('Firebase configuration is missing.')
      const { collection, doc, serverTimestamp, writeBatch } = services.firestoreSdk
      const revision = selected.revision + 1
      const version = selected.latestReleaseNumber + 1
      const releaseId = identifier('release', selected.lessonId).slice(0, 120)
      const auditId = identifier('audit', selected.lessonId)
      const batch = writeBatch(services.db)
      batch.set(doc(collection(services.db, 'lessonDrafts'), selected.lessonId), {
        ...normalized.content,
        lessonId: selected.lessonId,
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
      batch.set(doc(collection(services.db, 'lessonReleases'), releaseId), {
        releaseId,
        ...normalized.content,
        lessonId: selected.lessonId,
        version,
        draftRevision: revision,
        publishedAt: serverTimestamp(),
        publishedBy: user.uid,
        auditId,
      })
      batch.set(doc(collection(services.db, 'adminAudit'), auditId), {
        eventId: auditId,
        action: 'lesson.release.published',
        entityType: 'lessonRelease',
        entityId: selected.lessonId,
        actorUid: user.uid,
        revision,
        releaseId,
        createdAt: serverTimestamp(),
      })
      await batch.commit()
      clearRecovery()
      setPendingRecovery(null)
      setConfirmPublish(false)
      setNotice({ kind: 'success', message: `Lesson release ${version} published as an immutable snapshot.` })
    } catch {
      setNotice({ kind: 'error', message: 'Publishing failed safely. The lesson draft, release, and audit were not partially written.' })
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="course-workspace lesson-workspace">
      <header className="workspace-title">
        <div><p className="eyebrow">Phase 12 · Lesson releases</p><h1>Lesson workspace</h1><p>Write lessons, publish immutable releases, and keep practice checks browser-only.</p></div>
        <button className="primary-action" onClick={startNew}>New lesson</button>
      </header>

      {notice && <div className={`notice notice--${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.message}</div>}
      {pendingRecovery && <div className="recovery-notice"><div><strong>Unsaved lesson text found</strong><p>A local recovery copy from {new Date(pendingRecovery.savedAt).toLocaleString()} is available.</p></div><div><button type="button" onClick={discardLocalCopy}>Discard</button><button className="primary-action" type="button" onClick={recoverLocalCopy} disabled={loading}>Restore copy</button></div></div>}

      <div className="course-layout lesson-layout-admin">
        <aside className="course-list" aria-label="Lesson drafts">
          <div className="course-list__heading"><strong>Lesson drafts</strong><span>{lessons.length}</span></div>
          {loading && <p className="empty-list">Loading lessons...</p>}
          {!loading && lessons.length === 0 && <p className="empty-list">No lessons yet. Create the first lesson draft.</p>}
          {filteredLessons.map((lesson) => <button className={selectedId === lesson.lessonId ? 'selected' : ''} key={lesson.lessonId} onClick={() => chooseLesson(lesson.lessonId)}><span><strong>{lesson.order}. {lesson.title}</strong><small>{lesson.courseId} / {lesson.lessonId}</small></span><StatusPill status={lesson.status} /></button>)}
        </aside>

        <form className="course-editor lesson-editor" onSubmit={(event) => void saveLesson(event, 'draft')}>
          <div className="editor-heading"><div><p className="eyebrow">{selected ? `Revision ${selected.revision}` : 'New lesson draft'}</p><h2>{selected ? selected.title : 'Create a lesson'}</h2></div>{selected && <StatusPill status={selected.status} />}</div>
          <div className="field-grid">
            <label>Course<select value={form.courseId} onChange={(event) => updateField('courseId', event.target.value)} disabled={!!selected}>{courses.map((course) => <option key={course.courseId} value={course.courseId}>{course.title}</option>)}</select></label>
            <label>Lesson order<input type="number" value={form.order} onChange={(event) => updateField('order', event.target.value)} min={1} max={50} step={1} required /></label>
          </div>
          <label>Lesson ID<span>Permanent lowercase slug. It cannot be renamed later.</span><input value={form.lessonId} onChange={(event) => updateField('lessonId', event.target.value.toLowerCase())} disabled={!!selected} placeholder="clear-lesson-name" minLength={3} maxLength={64} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label>
          <label>Lesson title<span>5-100 characters</span><input value={form.title} onChange={(event) => updateField('title', event.target.value)} minLength={5} maxLength={100} required /></label>
          <label>Short summary<span>{form.summary.length}/240</span><textarea className="textarea--short" value={form.summary} onChange={(event) => updateField('summary', event.target.value)} minLength={20} maxLength={240} required /></label>
          <div className="field-grid">
            <label>Learning time (minutes)<input type="number" value={form.durationMinutes} onChange={(event) => updateField('durationMinutes', event.target.value)} min={5} max={300} step={1} required /></label>
            <label>YouTube video ID<span>Optional 11-character ID only</span><input value={form.videoYoutubeId} onChange={(event) => updateField('videoYoutubeId', event.target.value.trim())} maxLength={11} /></label>
          </div>
          <label>Written lesson<span>{form.bodyMarkdown.length}/12000 · plain text or simple Markdown</span><textarea className="lesson-body-input" value={form.bodyMarkdown} onChange={(event) => updateField('bodyMarkdown', event.target.value)} minLength={100} maxLength={12000} required /></label>
          <QuestionEditor label="Practice question 1" question={form.question1} onChange={(question) => updateField('question1', question)} />
          <QuestionEditor label="Practice question 2" question={form.question2} onChange={(question) => updateField('question2', question)} />
          <QuestionEditor label="Practice question 3" question={form.question3} onChange={(question) => updateField('question3', question)} />
          {normalized.errors.length > 0 && <div className="validation-list"><strong>Before saving</strong><ul>{normalized.errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
          <div className="editor-actions"><button type="button" onClick={() => void saveLesson(undefined, 'draft')} disabled={busy || normalized.errors.length > 0 || (selected?.status === 'draft' && !hasUnsavedChanges)}>{busy ? 'Saving...' : 'Save draft'}</button><button className="primary-action" type="button" onClick={() => void saveLesson(undefined, 'ready')} disabled={selectedId === 'new' || busy || normalized.errors.length > 0 || (selected?.status === 'ready' && !hasUnsavedChanges)}>{busy ? 'Saving...' : 'Mark review ready'}</button></div>
        </form>

        <aside className="course-preview lesson-preview">
          <p className="eyebrow">Lesson preview</p>
          <div className="preview-card">
            <span className="preview-category">Lesson {normalized.content.order || 0} · {normalized.content.durationMinutes || 0} min</span>
            <h2>{normalized.content.title || 'Lesson title'}</h2>
            <p>{normalized.content.summary || 'A short lesson summary will appear here.'}</p>
            <div className="preview-description">{normalized.content.bodyMarkdown || 'The written lesson will appear here.'}</div>
          </div>
          <div className="release-panel"><div className="release-panel__heading"><strong>Practice checks</strong><span>{[normalized.content.question1, normalized.content.question2, normalized.content.question3].filter((question) => question.enabled).length}</span></div>{[normalized.content.question1, normalized.content.question2, normalized.content.question3].map((question, index) => question.enabled ? <article key={index}><span>{question.prompt || `Question ${index + 1}`}</span><small>Answer {question.correctOption + 1}</small></article> : null)}</div>
          {selected && <div className="release-panel"><div className="release-panel__heading"><strong>Lesson releases</strong><span>{selectedReleases.length}</span></div>{selectedReleases.length === 0 && <p>No lesson releases published.</p>}{selectedReleases.map((release) => <article key={release.releaseId}><span>Release {release.version}</span><small>{readableDate(release.publishedAt)}</small></article>)}</div>}
          {selected?.status === 'ready' && <div className="publish-panel"><strong>Ready to publish</strong><p>Publishing creates an immutable lesson release. The lesson cannot change during the publish transaction.</p>{hasUnsavedChanges && <p className="publish-warning">Save or discard unsaved edits before publishing.</p>}{!hasUnsavedChanges && <label className="confirm-check"><input type="checkbox" checked={confirmPublish} onChange={(event) => setConfirmPublish(event.target.checked)} />I reviewed this exact lesson preview and want to publish it.</label>}<button className="publish-action" type="button" disabled={busy || hasUnsavedChanges || !confirmPublish} onClick={() => void publishLesson()}>{busy ? 'Publishing...' : `Publish release ${selected.latestReleaseNumber + 1}`}</button></div>}
        </aside>
      </div>
    </section>
  )
}
