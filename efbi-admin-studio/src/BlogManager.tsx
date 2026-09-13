import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { getAdminFirebase } from './firebase'
import {
  blogContentMatches,
  blogToneOptions,
  emptyBlogForm,
  formFromBlog,
  normalizeBlogForm,
  validPostId,
} from './blogModel'
import type { BlogDraft, BlogFormValues, BlogRelease, BlogStatus } from './blogModel'

type Notice = { kind: 'success' | 'error'; message: string } | null
type Recovery = { selectedId: string; postId: string; form: BlogFormValues; baseRevision: number | null; savedAt: string }

const recoveryKey = 'efbi-admin-blog-recovery-v1'

function safeString(value: unknown) { return typeof value === 'string' ? value : '' }
function safeNumber(value: unknown) { return typeof value === 'number' && Number.isFinite(value) ? value : 0 }

function asDraft(id: string, data: Record<string, unknown>): BlogDraft {
  return {
    postId: id, title: safeString(data.title), excerpt: safeString(data.excerpt), category: safeString(data.category),
    authorName: safeString(data.authorName), readingMinutes: safeNumber(data.readingMinutes), featured: data.featured === true,
    tone: safeString(data.tone) as BlogDraft['tone'], bodyMarkdown: safeString(data.bodyMarkdown),
    status: safeString(data.status) as BlogStatus, revision: safeNumber(data.revision), latestReleaseNumber: safeNumber(data.latestReleaseNumber),
    latestReleaseId: safeString(data.latestReleaseId), createdAt: data.createdAt, createdBy: safeString(data.createdBy),
    updatedAt: data.updatedAt, updatedBy: safeString(data.updatedBy), lastAuditId: safeString(data.lastAuditId),
  }
}

function asRelease(id: string, data: Record<string, unknown>): BlogRelease {
  return {
    releaseId: id, postId: safeString(data.postId), title: safeString(data.title), excerpt: safeString(data.excerpt),
    category: safeString(data.category), authorName: safeString(data.authorName), readingMinutes: safeNumber(data.readingMinutes),
    featured: data.featured === true, tone: safeString(data.tone) as BlogRelease['tone'], bodyMarkdown: safeString(data.bodyMarkdown),
    version: safeNumber(data.version), draftRevision: safeNumber(data.draftRevision), publishedAt: data.publishedAt,
    publishedBy: safeString(data.publishedBy), auditId: safeString(data.auditId),
  }
}

function readRecovery(): Recovery | null {
  try {
    const raw = localStorage.getItem(recoveryKey)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<Recovery>
    const form = value.form as Partial<BlogFormValues> | undefined
    if (typeof value.selectedId !== 'string' || typeof value.postId !== 'string' || typeof value.savedAt !== 'string' || !form) return null
    if (value.selectedId !== 'new' && !validPostId(value.selectedId)) return null
    if (typeof form.title !== 'string' || typeof form.excerpt !== 'string' || typeof form.category !== 'string' || typeof form.authorName !== 'string' || typeof form.readingMinutes !== 'string' || typeof form.featured !== 'boolean' || typeof form.bodyMarkdown !== 'string' || !blogToneOptions.includes(form.tone as BlogFormValues['tone'])) return null
    return { selectedId: value.selectedId, postId: value.postId, form: form as BlogFormValues, baseRevision: typeof value.baseRevision === 'number' ? value.baseRevision : null, savedAt: value.savedAt }
  } catch { return null }
}

function clearRecovery() { try { localStorage.removeItem(recoveryKey) } catch { /* Recovery is best-effort. */ } }

function identifier(prefix: 'audit' | 'release', postId: string) {
  const random = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-blog-${postId}-${random}`.slice(0, prefix === 'audit' ? 180 : 140)
}

function readableDate(value: unknown) {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') return value.toDate().toLocaleString()
  return 'Pending server time'
}

function StatusPill({ status }: { status: BlogStatus }) {
  return <span className={`status-pill status-pill--${status}`}>{status === 'ready' ? 'Review ready' : status}</span>
}

export default function BlogManager({ user }: { user: User }) {
  const [drafts, setDrafts] = useState<BlogDraft[]>([])
  const [releases, setReleases] = useState<BlogRelease[]>([])
  const [selectedId, setSelectedId] = useState('new')
  const [postId, setPostId] = useState('')
  const [form, setForm] = useState<BlogFormValues>({ ...emptyBlogForm })
  const [notice, setNotice] = useState<Notice>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [confirmPublish, setConfirmPublish] = useState(false)
  const [unpublishPhrase, setUnpublishPhrase] = useState('')
  const [recovery, setRecovery] = useState<Recovery | null>(() => readRecovery())
  const restoringRecovery = useRef(false)

  const selected = drafts.find((draft) => draft.postId === selectedId) ?? null
  const normalized = useMemo(() => normalizeBlogForm(form), [form])
  const hasChanges = selected ? !blogContentMatches(selected, normalized.content) : true
  const selectedReleases = releases.filter((release) => release.postId === selectedId).sort((left, right) => right.version - left.version)

  useEffect(() => {
    let active = true
    let stopDrafts: () => void = () => undefined
    let stopReleases: () => void = () => undefined
    void getAdminFirebase().then((services) => {
      if (!active || !services) return
      const { collection, onSnapshot } = services.firestoreSdk
      stopDrafts = onSnapshot(collection(services.db, 'blogDrafts'), (snapshot) => {
        if (!active) return
        setDrafts(snapshot.docs.map((item) => asDraft(item.id, item.data())).sort((left, right) => left.title.localeCompare(right.title)))
        setLoading(false)
      }, () => { if (active) { setNotice({ kind: 'error', message: 'Article drafts could not be loaded.' }); setLoading(false) } })
      stopReleases = onSnapshot(collection(services.db, 'blogReleases'), (snapshot) => {
        if (active) setReleases(snapshot.docs.map((item) => asRelease(item.id, item.data())))
      }, () => { if (active) setNotice({ kind: 'error', message: 'Article release history could not be loaded.' }) })
    }).catch(() => { if (active) { setNotice({ kind: 'error', message: 'Firebase could not start the blog workspace.' }); setLoading(false) } })
    return () => { active = false; stopDrafts(); stopReleases() }
  }, [])

  useEffect(() => {
    if (!selected) return
    if (restoringRecovery.current) { restoringRecovery.current = false; return }
    setForm(formFromBlog(selected)); setConfirmPublish(false); setUnpublishPhrase('')
  }, [selected])

  function store(nextForm: BlogFormValues, nextId = postId) {
    try { localStorage.setItem(recoveryKey, JSON.stringify({ selectedId, postId: nextId, form: nextForm, baseRevision: selected?.revision ?? null, savedAt: new Date().toISOString() })) } catch { /* Recovery is best-effort. */ }
  }

  function updateField<Key extends keyof BlogFormValues>(key: Key, value: BlogFormValues[Key]) {
    setForm((current) => { const next = { ...current, [key]: value }; store(next); return next })
    setConfirmPublish(false); setUnpublishPhrase('')
  }

  function startNew() { clearRecovery(); setRecovery(null); setSelectedId('new'); setPostId(''); setForm({ ...emptyBlogForm }); setConfirmPublish(false); setUnpublishPhrase(''); setNotice(null) }
  function choose(draft: BlogDraft) { clearRecovery(); setRecovery(null); setSelectedId(draft.postId); setNotice(null) }

  function restoreRecovery() {
    if (!recovery) return
    if (recovery.selectedId !== 'new') {
      const serverDraft = drafts.find((draft) => draft.postId === recovery.selectedId)
      if (!serverDraft || serverDraft.revision !== recovery.baseRevision) { clearRecovery(); setRecovery(null); setNotice({ kind: 'error', message: 'The server article changed, so the older recovery copy was not restored.' }); return }
    }
    restoringRecovery.current = recovery.selectedId !== selectedId
    setSelectedId(recovery.selectedId); setPostId(recovery.postId); setForm(recovery.form); setRecovery(null)
    setNotice({ kind: 'success', message: 'The locally saved article was restored. Review it before saving.' })
  }

  async function writeDraft(status: 'draft' | 'ready', create = false) {
    const id = create ? postId.trim() : selected?.postId ?? ''
    if (!validPostId(id)) { setNotice({ kind: 'error', message: 'Article ID must use 3–80 lowercase letters, numbers, and single hyphens.' }); return }
    if (create && drafts.some((draft) => draft.postId === id)) { setNotice({ kind: 'error', message: 'That permanent article ID is already in use.' }); return }
    if (!create && !selected) return
    if (normalized.errors.length) { setNotice({ kind: 'error', message: normalized.errors[0] }); return }
    setBusy(true); setNotice(null)
    try {
      const services = await getAdminFirebase()
      if (!services) throw new Error('Firebase unavailable')
      const { collection, doc, serverTimestamp, writeBatch } = services.firestoreSdk
      const auditId = identifier('audit', id)
      const revision = create ? 1 : selected!.revision + 1
      const batch = writeBatch(services.db)
      batch.set(doc(collection(services.db, 'blogDrafts'), id), {
        postId: id, ...normalized.content, status, revision,
        latestReleaseNumber: create ? 0 : selected!.latestReleaseNumber,
        latestReleaseId: create ? '' : selected!.latestReleaseId,
        createdAt: create ? serverTimestamp() : selected!.createdAt,
        createdBy: create ? user.uid : selected!.createdBy,
        updatedAt: serverTimestamp(), updatedBy: user.uid, lastAuditId: auditId,
      })
      batch.set(doc(collection(services.db, 'adminAudit'), auditId), {
        eventId: auditId, action: create ? 'blog.draft.created' : 'blog.draft.updated', entityType: 'blogDraft',
        entityId: id, actorUid: user.uid, revision, releaseId: create ? '' : selected!.latestReleaseId, createdAt: serverTimestamp(),
      })
      await batch.commit(); clearRecovery(); setRecovery(null); setSelectedId(id)
      setNotice({ kind: 'success', message: create ? 'Article draft created with an audit record.' : status === 'ready' ? 'Article marked review ready.' : 'Article draft saved.' })
    } catch { setNotice({ kind: 'error', message: 'The article was not saved. No partial change was written.' }) } finally { setBusy(false) }
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
      const releaseId = identifier('release', selected.postId)
      const auditId = identifier('audit', selected.postId)
      const publication = { postId: selected.postId, ...normalized.content, releaseId, version, publishedAt: serverTimestamp(), publishedBy: user.uid, auditId }
      const batch = writeBatch(services.db)
      batch.set(doc(collection(services.db, 'blogDrafts'), selected.postId), { postId: selected.postId, ...normalized.content, status: 'published', revision, latestReleaseNumber: version, latestReleaseId: releaseId, createdAt: selected.createdAt, createdBy: selected.createdBy, updatedAt: serverTimestamp(), updatedBy: user.uid, lastAuditId: auditId })
      batch.set(doc(collection(services.db, 'blogReleases'), releaseId), { ...publication, releaseId, draftRevision: revision })
      batch.set(doc(collection(services.db, 'publishedPosts'), selected.postId), publication)
      batch.set(doc(collection(services.db, 'adminAudit'), auditId), { eventId: auditId, action: 'blog.release.published', entityType: 'blogRelease', entityId: selected.postId, actorUid: user.uid, revision, releaseId, createdAt: serverTimestamp() })
      await batch.commit(); clearRecovery(); setRecovery(null); setConfirmPublish(false)
      setNotice({ kind: 'success', message: `Article release ${version} is now public.` })
    } catch { setNotice({ kind: 'error', message: 'Publishing failed safely. No partial article publication was written.' }) } finally { setBusy(false) }
  }

  async function unpublish() {
    if (!selected || selected.status !== 'published' || hasChanges || unpublishPhrase !== 'UNPUBLISH ARTICLE') return
    setBusy(true); setNotice(null)
    try {
      const services = await getAdminFirebase()
      if (!services) throw new Error('Firebase unavailable')
      const { collection, doc, serverTimestamp, writeBatch } = services.firestoreSdk
      const revision = selected.revision + 1
      const auditId = identifier('audit', selected.postId)
      const batch = writeBatch(services.db)
      batch.set(doc(collection(services.db, 'blogDrafts'), selected.postId), { postId: selected.postId, ...normalized.content, status: 'unpublished', revision, latestReleaseNumber: selected.latestReleaseNumber, latestReleaseId: selected.latestReleaseId, createdAt: selected.createdAt, createdBy: selected.createdBy, updatedAt: serverTimestamp(), updatedBy: user.uid, lastAuditId: auditId })
      batch.delete(doc(collection(services.db, 'publishedPosts'), selected.postId))
      batch.set(doc(collection(services.db, 'adminAudit'), auditId), { eventId: auditId, action: 'blog.post.unpublished', entityType: 'blogDraft', entityId: selected.postId, actorUid: user.uid, revision, releaseId: selected.latestReleaseId, createdAt: serverTimestamp() })
      await batch.commit(); setUnpublishPhrase('')
      setNotice({ kind: 'success', message: 'The article is no longer public. Its immutable releases remain in history.' })
    } catch { setNotice({ kind: 'error', message: 'Unpublishing failed safely. The public article and draft state were not split.' }) } finally { setBusy(false) }
  }

  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!selected) void writeDraft('draft', true) }

  return <section className="course-workspace blog-workspace-admin">
    <header className="workspace-title"><div><p className="eyebrow">Phase 24 · Content operations</p><h1>Blog workspace</h1><p>Write useful articles, preview every change, and control exactly what becomes public.</p></div><button className="primary-action" onClick={startNew}>New article</button></header>
    {notice && <div className={`notice notice--${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.message}</div>}
    {recovery && <div className="recovery-notice"><div><strong>Unsaved article found</strong><p>A local copy from {new Date(recovery.savedAt).toLocaleString()} is available.</p></div><div><button onClick={() => { clearRecovery(); setRecovery(null) }}>Discard</button><button className="primary-action" onClick={restoreRecovery}>Restore copy</button></div></div>}
    <div className="course-layout blog-layout-admin">
      <aside className="course-list" aria-label="Article drafts"><div className="course-list__heading"><strong>Article library</strong><span>{drafts.length}</span></div>{loading && <p className="empty-list">Loading articles…</p>}{!loading && drafts.length === 0 && <p className="empty-list">No article drafts yet.</p>}{drafts.map((draft) => <button className={selectedId === draft.postId ? 'selected' : ''} key={draft.postId} onClick={() => choose(draft)}><span><strong>{draft.title}</strong><small>{draft.category} · {draft.postId}</small></span><StatusPill status={draft.status} /></button>)}</aside>
      <form className="course-editor" onSubmit={submit}><div className="editor-heading"><div><p className="eyebrow">{selected ? `Revision ${selected.revision}` : 'New draft'}</p><h2>{selected?.title ?? 'Create an article'}</h2></div>{selected && <StatusPill status={selected.status} />}</div>
        {!selected && <label>Article ID<span>Permanent lowercase link used after publication.</span><input value={postId} onChange={(event) => { const next = event.target.value.toLowerCase(); setPostId(next); store(form, next) }} placeholder="building-a-strong-portfolio" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" minLength={3} maxLength={80} required /></label>}
        <label>Article title<input value={form.title} onChange={(event) => updateField('title', event.target.value)} minLength={5} maxLength={120} required /></label>
        <label>Short excerpt<span>{form.excerpt.length}/320 · shown in the article list</span><textarea className="textarea--short" value={form.excerpt} onChange={(event) => updateField('excerpt', event.target.value)} minLength={20} maxLength={320} required /></label>
        <div className="field-grid"><label>Category<input value={form.category} onChange={(event) => updateField('category', event.target.value)} minLength={2} maxLength={40} required /></label><label>Author<input value={form.authorName} onChange={(event) => updateField('authorName', event.target.value)} minLength={2} maxLength={80} required /></label><label>Reading time (minutes)<input type="number" value={form.readingMinutes} onChange={(event) => updateField('readingMinutes', event.target.value)} min={1} max={60} required /></label><label>Color<select value={form.tone} onChange={(event) => updateField('tone', event.target.value as BlogFormValues['tone'])}>{blogToneOptions.map((tone) => <option key={tone} value={tone}>{tone[0].toUpperCase() + tone.slice(1)}</option>)}</select></label></div>
        <label className="confirm-check"><input type="checkbox" checked={form.featured} onChange={(event) => updateField('featured', event.target.checked)} />Feature this article at the top of the blog.</label>
        <label>Article body<span>{form.bodyMarkdown.length}/20000 · simple Markdown or plain text</span><textarea className="blog-body-input" value={form.bodyMarkdown} onChange={(event) => updateField('bodyMarkdown', event.target.value)} minLength={100} maxLength={20000} required /></label>
        {normalized.errors.length > 0 && <div className="validation-list"><strong>Before saving</strong><ul>{normalized.errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
        <div className="editor-actions">{!selected && <button className="primary-action" type="submit" disabled={busy || normalized.errors.length > 0}>{busy ? 'Creating…' : 'Create draft'}</button>}{selected && <><button type="button" onClick={() => void writeDraft('draft')} disabled={busy || normalized.errors.length > 0 || (selected.status !== 'ready' && !hasChanges)}>Save draft</button><button className="primary-action" type="button" onClick={() => void writeDraft('ready')} disabled={busy || normalized.errors.length > 0 || (selected.status === 'ready' && !hasChanges)}>Mark review ready</button></>}</div>
      </form>
      <aside className="course-preview blog-preview-admin"><p className="eyebrow">Article preview</p><article className={`blog-admin-card tone-${normalized.content.tone}`}><span>{normalized.content.category || 'Category'}</span>{normalized.content.featured && <small>Featured article</small>}<h2>{normalized.content.title || 'Article title'}</h2><p>{normalized.content.excerpt || 'The article excerpt appears here.'}</p><div className="blog-admin-meta">{normalized.content.authorName || 'Author'} · {normalized.content.readingMinutes || 0} min read</div><div className="blog-admin-body">{normalized.content.bodyMarkdown || 'The full article appears here.'}</div></article>
        {selected && <div className="release-panel"><div className="release-panel__heading"><strong>Release history</strong><span>{selectedReleases.length}</span></div>{selectedReleases.length === 0 && <p>No releases yet.</p>}{selectedReleases.map((release) => <article key={release.releaseId}><span>Release {release.version}</span><small>{readableDate(release.publishedAt)}</small></article>)}</div>}
        {selected?.status === 'ready' && <div className="publish-panel"><strong>Ready to publish</strong><p>This creates an immutable release and a public article in one protected operation.</p>{hasChanges ? <p className="publish-warning">Save or discard unsaved changes first.</p> : <label className="confirm-check"><input type="checkbox" checked={confirmPublish} onChange={(event) => setConfirmPublish(event.target.checked)} />I reviewed this exact article preview.</label>}<button className="publish-action" type="button" onClick={() => void publish()} disabled={busy || hasChanges || !confirmPublish}>Publish release {selected.latestReleaseNumber + 1}</button></div>}
        {selected?.status === 'published' && <div className="publish-panel publish-panel--danger"><strong>Remove from the public blog</strong><p>The current public copy will disappear. Immutable releases remain available to administrators.</p>{hasChanges && <p className="publish-warning">Discard or save unsaved changes first.</p>}<label>Type UNPUBLISH ARTICLE<input value={unpublishPhrase} onChange={(event) => setUnpublishPhrase(event.target.value)} autoComplete="off" /></label><button type="button" onClick={() => void unpublish()} disabled={busy || hasChanges || unpublishPhrase !== 'UNPUBLISH ARTICLE'}>Unpublish article</button></div>}
      </aside>
    </div>
  </section>
}
