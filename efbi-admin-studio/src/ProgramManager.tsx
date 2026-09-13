import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { getAdminFirebase } from './firebase'
import {
  emptyProgramForm,
  formFromProgram,
  normalizeProgramForm,
  programAccentOptions,
  programContentMatches,
  programLevelOptions,
  validProgramId,
} from './programModel'
import type { ProgramDraft, ProgramFormValues, ProgramRelease, ProgramStatus } from './programModel'

type Notice = { kind: 'success' | 'error'; message: string } | null

const recoveryKey = 'efbi-admin-program-recovery-v1'

function safeString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function safeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function asDraft(id: string, data: Record<string, unknown>): ProgramDraft {
  return {
    programId: id,
    title: safeString(data.title),
    shortTitle: safeString(data.shortTitle),
    description: safeString(data.description),
    outcome: safeString(data.outcome),
    level: safeString(data.level) as ProgramDraft['level'],
    durationWeeks: safeNumber(data.durationWeeks),
    accent: safeString(data.accent) as ProgramDraft['accent'],
    order: safeNumber(data.order),
    status: safeString(data.status) as ProgramStatus,
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

function asRelease(id: string, data: Record<string, unknown>): ProgramRelease {
  return {
    releaseId: id,
    programId: safeString(data.programId),
    title: safeString(data.title),
    shortTitle: safeString(data.shortTitle),
    description: safeString(data.description),
    outcome: safeString(data.outcome),
    level: safeString(data.level) as ProgramRelease['level'],
    durationWeeks: safeNumber(data.durationWeeks),
    accent: safeString(data.accent) as ProgramRelease['accent'],
    order: safeNumber(data.order),
    version: safeNumber(data.version),
    draftRevision: safeNumber(data.draftRevision),
    publishedAt: data.publishedAt,
    publishedBy: safeString(data.publishedBy),
    auditId: safeString(data.auditId),
  }
}

function readRecovery(): { selectedId: string; programId: string; form: ProgramFormValues; baseRevision: number | null; savedAt: string } | null {
  try {
    const raw = localStorage.getItem(recoveryKey)
    if (!raw) return null
    const value = JSON.parse(raw) as Record<string, unknown>
    const form = value.form as Partial<ProgramFormValues> | undefined
    if (typeof value.selectedId !== 'string' || typeof value.programId !== 'string' || typeof value.savedAt !== 'string' || !form) return null
    if (value.selectedId !== 'new' && !validProgramId(value.selectedId)) return null
    if (typeof form.title !== 'string' || typeof form.shortTitle !== 'string' || typeof form.description !== 'string' || typeof form.outcome !== 'string' || typeof form.durationWeeks !== 'string' || typeof form.order !== 'string') return null
    if (!programLevelOptions.includes(form.level as ProgramFormValues['level']) || !programAccentOptions.includes(form.accent as ProgramFormValues['accent'])) return null
    return { selectedId: value.selectedId, programId: value.programId, form: form as ProgramFormValues, baseRevision: typeof value.baseRevision === 'number' ? value.baseRevision : null, savedAt: value.savedAt }
  } catch {
    return null
  }
}

function clearRecovery() {
  try { localStorage.removeItem(recoveryKey) } catch { /* Recovery is best-effort. */ }
}

function identifier(prefix: 'audit' | 'release', programId: string) {
  const random = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-program-${programId}-${random}`.slice(0, prefix === 'audit' ? 180 : 120)
}

function readableDate(value: unknown) {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') return value.toDate().toLocaleString()
  return 'Pending server time'
}

function StatusPill({ status }: { status: ProgramStatus }) {
  return <span className={`status-pill status-pill--${status}`}>{status === 'ready' ? 'Review ready' : status}</span>
}

export default function ProgramManager({ user }: { user: User }) {
  const [drafts, setDrafts] = useState<ProgramDraft[]>([])
  const [releases, setReleases] = useState<ProgramRelease[]>([])
  const [selectedId, setSelectedId] = useState('new')
  const [programId, setProgramId] = useState('')
  const [form, setForm] = useState<ProgramFormValues>({ ...emptyProgramForm })
  const [notice, setNotice] = useState<Notice>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [confirmPublish, setConfirmPublish] = useState(false)
  const [recovery, setRecovery] = useState(() => readRecovery())
  const restoringRecovery = useRef(false)

  const selected = drafts.find((draft) => draft.programId === selectedId) ?? null
  const normalized = useMemo(() => normalizeProgramForm(form), [form])
  const hasChanges = selected ? !programContentMatches(selected, normalized.content) : true
  const selectedReleases = releases.filter((release) => release.programId === selectedId).sort((left, right) => right.version - left.version)

  useEffect(() => {
    let active = true
    let stopDrafts: () => void = () => undefined
    let stopReleases: () => void = () => undefined
    void getAdminFirebase().then((services) => {
      if (!active || !services) return
      const { collection, onSnapshot } = services.firestoreSdk
      stopDrafts = onSnapshot(collection(services.db, 'programDrafts'), (snapshot) => {
        if (!active) return
        setDrafts(snapshot.docs.map((item) => asDraft(item.id, item.data())).sort((left, right) => left.order - right.order || left.title.localeCompare(right.title)))
        setLoading(false)
      }, () => { if (active) { setNotice({ kind: 'error', message: 'Program drafts could not be loaded.' }); setLoading(false) } })
      stopReleases = onSnapshot(collection(services.db, 'programReleases'), (snapshot) => {
        if (active) setReleases(snapshot.docs.map((item) => asRelease(item.id, item.data())))
      }, () => { if (active) setNotice({ kind: 'error', message: 'Program release history could not be loaded.' }) })
    }).catch(() => { if (active) { setNotice({ kind: 'error', message: 'Firebase could not start the program workspace.' }); setLoading(false) } })
    return () => { active = false; stopDrafts(); stopReleases() }
  }, [])

  useEffect(() => {
    if (selected) {
      if (restoringRecovery.current) {
        restoringRecovery.current = false
        return
      }
      setForm(formFromProgram(selected))
      setConfirmPublish(false)
    }
  }, [selected])

  function store(nextForm: ProgramFormValues, nextId = programId) {
    try { localStorage.setItem(recoveryKey, JSON.stringify({ selectedId, programId: nextId, form: nextForm, baseRevision: selected?.revision ?? null, savedAt: new Date().toISOString() })) } catch { /* Recovery is best-effort. */ }
  }

  function updateField<Key extends keyof ProgramFormValues>(key: Key, value: ProgramFormValues[Key]) {
    setForm((current) => { const next = { ...current, [key]: value }; store(next); return next })
    setConfirmPublish(false)
  }

  function startNew() {
    clearRecovery(); setRecovery(null); setSelectedId('new'); setProgramId(''); setForm({ ...emptyProgramForm }); setConfirmPublish(false); setNotice(null)
  }

  function choose(program: ProgramDraft) {
    clearRecovery(); setRecovery(null); setSelectedId(program.programId); setNotice(null)
  }

  function restoreRecovery() {
    if (!recovery) return
    if (recovery.selectedId !== 'new') {
      const serverDraft = drafts.find((draft) => draft.programId === recovery.selectedId)
      if (!serverDraft || serverDraft.revision !== recovery.baseRevision) {
        clearRecovery(); setRecovery(null); setNotice({ kind: 'error', message: 'The server draft changed, so the older recovery copy was not restored.' }); return
      }
    }
    restoringRecovery.current = recovery.selectedId !== selectedId
    setSelectedId(recovery.selectedId); setProgramId(recovery.programId); setForm(recovery.form); setRecovery(null)
    setNotice({ kind: 'success', message: 'The locally saved program text was restored. Review it before saving.' })
  }

  async function writeDraft(status: 'draft' | 'ready', create = false) {
    const id = create ? programId.trim() : selected?.programId ?? ''
    if (!validProgramId(id)) { setNotice({ kind: 'error', message: 'Program ID must use 3–64 lowercase letters, numbers, and single hyphens.' }); return }
    if (create && drafts.some((draft) => draft.programId === id)) { setNotice({ kind: 'error', message: 'That permanent program ID is already in use.' }); return }
    if (normalized.errors.length) { setNotice({ kind: 'error', message: normalized.errors[0] }); return }
    setBusy(true); setNotice(null)
    try {
      const services = await getAdminFirebase()
      if (!services) throw new Error('Firebase unavailable')
      const { collection, doc, serverTimestamp, writeBatch } = services.firestoreSdk
      const auditId = identifier('audit', id)
      const revision = create ? 1 : (selected?.revision ?? 0) + 1
      const batch = writeBatch(services.db)
      batch.set(doc(collection(services.db, 'programDrafts'), id), {
        programId: id, ...normalized.content, status, revision,
        latestReleaseNumber: create ? 0 : selected?.latestReleaseNumber,
        latestReleaseId: create ? '' : selected?.latestReleaseId,
        createdAt: create ? serverTimestamp() : selected?.createdAt,
        createdBy: create ? user.uid : selected?.createdBy,
        updatedAt: serverTimestamp(), updatedBy: user.uid, lastAuditId: auditId,
      })
      batch.set(doc(collection(services.db, 'adminAudit'), auditId), {
        eventId: auditId,
        action: create ? 'program.draft.created' : 'program.draft.updated',
        entityType: 'programDraft', entityId: id, actorUid: user.uid, revision,
        releaseId: create ? '' : selected?.latestReleaseId ?? '', createdAt: serverTimestamp(),
      })
      await batch.commit()
      clearRecovery(); setRecovery(null); setSelectedId(id)
      setNotice({ kind: 'success', message: create ? 'Program draft created with an audit record.' : status === 'ready' ? 'Program marked review ready.' : 'Program draft saved.' })
    } catch {
      setNotice({ kind: 'error', message: 'The program was not saved. No partial change was written.' })
    } finally { setBusy(false) }
  }

  async function publish() {
    if (!selected || selected.status !== 'ready' || hasChanges || normalized.errors.length || !confirmPublish) return
    setBusy(true); setNotice(null)
    try {
      const services = await getAdminFirebase()
      if (!services) throw new Error('Firebase unavailable')
      const { collection, doc, serverTimestamp, writeBatch } = services.firestoreSdk
      const revision = selected.revision + 1
      const version = selected.latestReleaseNumber + 1
      const releaseId = identifier('release', selected.programId)
      const auditId = identifier('audit', selected.programId)
      const release = { releaseId, programId: selected.programId, ...normalized.content, version, draftRevision: revision, publishedAt: serverTimestamp(), publishedBy: user.uid, auditId }
      const batch = writeBatch(services.db)
      batch.set(doc(collection(services.db, 'programDrafts'), selected.programId), {
        programId: selected.programId, ...normalized.content, status: 'published', revision,
        latestReleaseNumber: version, latestReleaseId: releaseId, createdAt: selected.createdAt,
        createdBy: selected.createdBy, updatedAt: serverTimestamp(), updatedBy: user.uid, lastAuditId: auditId,
      })
      batch.set(doc(collection(services.db, 'programReleases'), releaseId), release)
      batch.set(doc(collection(services.db, 'publishedPrograms'), selected.programId), {
        programId: selected.programId, ...normalized.content, releaseId, version,
        publishedAt: serverTimestamp(), publishedBy: user.uid, auditId,
      })
      batch.set(doc(collection(services.db, 'adminAudit'), auditId), {
        eventId: auditId, action: 'program.release.published', entityType: 'programRelease',
        entityId: selected.programId, actorUid: user.uid, revision, releaseId, createdAt: serverTimestamp(),
      })
      await batch.commit()
      clearRecovery(); setRecovery(null); setConfirmPublish(false)
      setNotice({ kind: 'success', message: `Program release ${version} is published and now available to the website.` })
    } catch {
      setNotice({ kind: 'error', message: 'Publishing failed safely. No draft, release, public record, or audit was partially written.' })
    } finally { setBusy(false) }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) void writeDraft('draft', true)
  }

  return <section className="course-workspace program-workspace">
    <header className="workspace-title"><div><p className="eyebrow">Phase 24 · Content operations</p><h1>Program workspace</h1><p>Organize learning paths, review changes, and publish the program cards shown on the website.</p></div><button className="primary-action" onClick={startNew}>New program</button></header>
    {notice && <div className={`notice notice--${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.message}</div>}
    {recovery && <div className="recovery-notice"><div><strong>Unsaved program text found</strong><p>A local copy from {new Date(recovery.savedAt).toLocaleString()} is available.</p></div><div><button onClick={() => { clearRecovery(); setRecovery(null) }}>Discard</button><button className="primary-action" onClick={restoreRecovery}>Restore copy</button></div></div>}
    <div className="course-layout">
      <aside className="course-list" aria-label="Program drafts"><div className="course-list__heading"><strong>Program library</strong><span>{drafts.length}</span></div>{loading && <p className="empty-list">Loading programs…</p>}{!loading && drafts.length === 0 && <p className="empty-list">No program drafts yet.</p>}{drafts.map((draft) => <button className={selectedId === draft.programId ? 'selected' : ''} key={draft.programId} onClick={() => choose(draft)}><span><strong>{draft.title}</strong><small>{draft.programId} · position {draft.order}</small></span><StatusPill status={draft.status} /></button>)}</aside>
      <form className="course-editor" onSubmit={submit}>
        <div className="editor-heading"><div><p className="eyebrow">{selected ? `Revision ${selected.revision}` : 'New draft'}</p><h2>{selected?.title ?? 'Create a program'}</h2></div>{selected && <StatusPill status={selected.status} />}</div>
        {!selected && <label>Program ID<span>Permanent lowercase slug used by courses and page links.</span><input value={programId} onChange={(event) => { const next = event.target.value.toLowerCase(); setProgramId(next); store(form, next) }} placeholder="scholarship-readiness" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" minLength={3} maxLength={64} required /></label>}
        <div className="field-grid"><label>Program title<input value={form.title} onChange={(event) => updateField('title', event.target.value)} minLength={3} maxLength={80} required /></label><label>Short title<input value={form.shortTitle} onChange={(event) => updateField('shortTitle', event.target.value)} minLength={2} maxLength={16} required /></label></div>
        <label>Description<span>{form.description.length}/500 · shown on the program card</span><textarea className="textarea--short" value={form.description} onChange={(event) => updateField('description', event.target.value)} minLength={20} maxLength={500} required /></label>
        <label>Learner outcome<span>{form.outcome.length}/300 · what learners work toward</span><textarea className="textarea--short" value={form.outcome} onChange={(event) => updateField('outcome', event.target.value)} minLength={20} maxLength={300} required /></label>
        <div className="field-grid"><label>Level<select value={form.level} onChange={(event) => updateField('level', event.target.value as ProgramFormValues['level'])}>{programLevelOptions.map((level) => <option key={level} value={level}>{level[0].toUpperCase() + level.slice(1)}</option>)}</select></label><label>Duration (weeks)<input type="number" value={form.durationWeeks} onChange={(event) => updateField('durationWeeks', event.target.value)} min={1} max={52} required /></label><label>Accent<select value={form.accent} onChange={(event) => updateField('accent', event.target.value as ProgramFormValues['accent'])}>{programAccentOptions.map((accent) => <option key={accent} value={accent}>{accent[0].toUpperCase() + accent.slice(1)}</option>)}</select></label><label>Display order<input type="number" value={form.order} onChange={(event) => updateField('order', event.target.value)} min={1} max={50} required /></label></div>
        {normalized.errors.length > 0 && <div className="validation-list"><strong>Before saving</strong><ul>{normalized.errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
        <div className="editor-actions">{!selected && <button className="primary-action" type="submit" disabled={busy || normalized.errors.length > 0}>{busy ? 'Creating…' : 'Create draft'}</button>}{selected && <><button type="button" onClick={() => void writeDraft('draft')} disabled={busy || normalized.errors.length > 0 || (selected.status !== 'ready' && !hasChanges)}>Save draft</button><button className="primary-action" type="button" onClick={() => void writeDraft('ready')} disabled={busy || normalized.errors.length > 0 || (selected.status === 'ready' && !hasChanges)}>Mark review ready</button></>}</div>
      </form>
      <aside className="course-preview"><p className="eyebrow">Safe preview</p><article className={`program-admin-preview accent-${normalized.content.accent}`}><span className="program-admin-preview__short">{normalized.content.shortTitle || 'EFBI'}</span><small>{normalized.content.level} · {normalized.content.durationWeeks || 0} weeks</small><h2>{normalized.content.title || 'Program title'}</h2><p>{normalized.content.description || 'The public program description appears here.'}</p><strong>Learning outcome</strong><p>{normalized.content.outcome || 'The learner outcome appears here.'}</p></article>
        {selected && <div className="release-panel"><div className="release-panel__heading"><strong>Release history</strong><span>{selectedReleases.length}</span></div>{selectedReleases.length === 0 && <p>No releases yet.</p>}{selectedReleases.map((release) => <article key={release.releaseId}><span>Release {release.version}</span><small>{readableDate(release.publishedAt)}</small></article>)}</div>}
        {selected?.status === 'ready' && <div className="publish-panel"><strong>Ready to publish</strong><p>This creates an immutable release and replaces the public card in one protected operation.</p>{hasChanges ? <p className="publish-warning">Save or discard unsaved changes first.</p> : <label className="confirm-check"><input type="checkbox" checked={confirmPublish} onChange={(event) => setConfirmPublish(event.target.checked)} />I reviewed this exact program preview.</label>}<button className="publish-action" type="button" onClick={() => void publish()} disabled={busy || hasChanges || !confirmPublish}>Publish release {selected.latestReleaseNumber + 1}</button></div>}
      </aside>
    </div>
  </section>
}
