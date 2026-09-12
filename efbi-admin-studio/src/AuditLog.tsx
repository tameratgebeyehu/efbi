import { useEffect, useMemo, useState } from 'react'
import { getAdminFirebase } from './firebase'

type AuditEvent = {
  eventId: string
  action: string
  entityType: string
  entityId: string
  actorUid: string
  revision: number
  releaseId: string
  createdAt: unknown
}

type RecordType = 'all' | 'course' | 'lesson'

const actionOptions = [
  { value: 'course.draft.created', label: 'Course draft created' },
  { value: 'course.draft.updated', label: 'Course draft updated' },
  { value: 'course.release.published', label: 'Course release published' },
  { value: 'lesson.draft.created', label: 'Lesson draft created' },
  { value: 'lesson.draft.updated', label: 'Lesson draft updated' },
  { value: 'lesson.release.published', label: 'Lesson release published' },
] as const

function safeString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function safeInteger(value: unknown) {
  return Number.isInteger(value) ? Number(value) : 0
}

function asAuditEvent(id: string, data: Record<string, unknown>): AuditEvent {
  return {
    eventId: safeString(data.eventId) || id,
    action: safeString(data.action),
    entityType: safeString(data.entityType),
    entityId: safeString(data.entityId),
    actorUid: safeString(data.actorUid),
    revision: safeInteger(data.revision),
    releaseId: safeString(data.releaseId),
    createdAt: data.createdAt,
  }
}

function dateFromTimestamp(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const timestamp = value as { toDate?: () => Date; seconds?: number }
  if (typeof timestamp.toDate === 'function') {
    const date = timestamp.toDate()
    return Number.isNaN(date.getTime()) ? null : date
  }
  if (typeof timestamp.seconds === 'number') {
    const date = new Date(timestamp.seconds * 1000)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

function readableDate(value: unknown) {
  const date = dateFromTimestamp(value)
  return date ? date.toLocaleString() : 'Time unavailable'
}

function actionLabel(value: string) {
  return actionOptions.find((option) => option.value === value)?.label ?? value
}

function recordLabel(value: string) {
  if (value.startsWith('course')) return 'Course'
  if (value.startsWith('lesson')) return 'Lesson'
  return 'Record'
}

export default function AuditLog() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recordType, setRecordType] = useState<RecordType>('all')
  const [entityId, setEntityId] = useState('')
  const [action, setAction] = useState('all')
  const [actorUid, setActorUid] = useState('')
  const [releaseId, setReleaseId] = useState('')

  useEffect(() => {
    let active = true
    let stop: () => void = () => undefined
    void getAdminFirebase().then((services) => {
      if (!active || !services) return
      const { collection, limit, onSnapshot, orderBy, query } = services.firestoreSdk
      const auditQuery = query(collection(services.db, 'adminAudit'), orderBy('createdAt', 'desc'), limit(250))
      stop = onSnapshot(auditQuery, (snapshot) => {
        if (!active) return
        setEvents(snapshot.docs.map((item) => asAuditEvent(item.id, item.data())))
        setError('')
        setLoading(false)
      }, () => {
        if (!active) return
        setError('Audit history could not be loaded. Confirm this account still has administrator access.')
        setLoading(false)
      })
    }).catch(() => {
      if (!active) return
      setError('Firebase could not start the audit history safely.')
      setLoading(false)
    })
    return () => { active = false; stop() }
  }, [])

  const filteredEvents = useMemo(() => {
    const wantedEntity = entityId.trim().toLowerCase()
    const wantedActor = actorUid.trim().toLowerCase()
    const wantedRelease = releaseId.trim().toLowerCase()
    return events.filter((event) => {
      if (recordType !== 'all' && !event.entityType.startsWith(recordType)) return false
      if (action !== 'all' && event.action !== action) return false
      if (wantedEntity && !event.entityId.toLowerCase().includes(wantedEntity)) return false
      if (wantedActor && !event.actorUid.toLowerCase().includes(wantedActor)) return false
      if (wantedRelease && !event.releaseId.toLowerCase().includes(wantedRelease)) return false
      return true
    })
  }, [action, actorUid, entityId, events, recordType, releaseId])

  const hasFilters = recordType !== 'all' || action !== 'all' || entityId || actorUid || releaseId

  function clearFilters() {
    setRecordType('all')
    setEntityId('')
    setAction('all')
    setActorUid('')
    setReleaseId('')
  }

  return (
    <section className="audit-workspace">
      <header className="workspace-title">
        <div><p className="eyebrow">Phase 14 · Immutable history</p><h1>Audit history</h1><p>Review who changed or published course content. These records are live and read-only.</p></div>
        <span className="security-badge">Read-only records</span>
      </header>

      <section className="audit-summary" aria-label="Audit history summary">
        <article><small>Loaded</small><strong>{events.length}</strong><p>Newest events, up to 250.</p></article>
        <article><small>Showing</small><strong>{filteredEvents.length}</strong><p>Events matching these filters.</p></article>
        <article><small>Protection</small><strong>Immutable</strong><p>No edit or delete action exists.</p></article>
      </section>

      <section className="audit-filters" aria-label="Filter audit history">
        <div className="audit-filter-heading"><div><p className="eyebrow">Find an event</p><h2>Filters</h2></div>{hasFilters && <button type="button" onClick={clearFilters}>Clear filters</button>}</div>
        <div className="audit-filter-grid">
          <label>Record type<select value={recordType} onChange={(event) => setRecordType(event.target.value as RecordType)}><option value="all">All courses and lessons</option><option value="course">Courses only</option><option value="lesson">Lessons only</option></select></label>
          <label>Action<select value={action} onChange={(event) => setAction(event.target.value)}><option value="all">All actions</option>{actionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label>Course or lesson ID<input value={entityId} onChange={(event) => setEntityId(event.target.value)} placeholder="ai-foundations" /></label>
          <label>Actor ID<input value={actorUid} onChange={(event) => setActorUid(event.target.value)} placeholder="Firebase user ID" /></label>
          <label>Release ID<input value={releaseId} onChange={(event) => setReleaseId(event.target.value)} placeholder="Published releases only" /></label>
        </div>
      </section>

      {error && <div className="notice notice--error" role="alert">{error}</div>}
      <section className="audit-list" aria-label="Audit events" aria-live="polite">
        <div className="audit-list__heading"><strong>History</strong><span>Newest first</span></div>
        {loading && <div className="audit-empty"><div className="spinner" /><strong>Loading protected history…</strong></div>}
        {!loading && !error && filteredEvents.length === 0 && <div className="audit-empty"><strong>{events.length ? 'No events match these filters.' : 'No audit events yet.'}</strong><p>{events.length ? 'Clear one or more filters to see additional history.' : 'Events will appear after an administrator saves or publishes content.'}</p></div>}
        {!loading && filteredEvents.map((event) => (
          <article className="audit-event" key={event.eventId}>
            <div className={`audit-event__mark ${event.action.includes('published') ? 'audit-event__mark--published' : ''}`} aria-hidden="true" />
            <div className="audit-event__main">
              <div className="audit-event__title"><div><span>{actionLabel(event.action)}</span><small>{recordLabel(event.entityType)} · revision {event.revision}</small></div><time>{readableDate(event.createdAt)}</time></div>
              <dl>
                <div><dt>{recordLabel(event.entityType)} ID</dt><dd title={event.entityId}>{event.entityId || 'Unavailable'}</dd></div>
                <div><dt>Actor ID</dt><dd title={event.actorUid}>{event.actorUid || 'Unavailable'}</dd></div>
                <div><dt>Release ID</dt><dd title={event.releaseId}>{event.releaseId || 'Not a publication'}</dd></div>
                <div><dt>Event ID</dt><dd title={event.eventId}>{event.eventId}</dd></div>
              </dl>
            </div>
          </article>
        ))}
      </section>
      <p className="audit-boundary"><strong>Security boundary:</strong> this page can read administrator audit records but cannot change or delete them. Learners and reviewers cannot open this collection.</p>
    </section>
  )
}
