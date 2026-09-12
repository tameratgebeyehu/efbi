import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { getAdminFirebase } from './firebase'
import './retention.css'

type RequestStatus = 'requested' | 'cancelled' | 'held' | 'completed'
type DeletionRequest = {
  requestId: string
  learnerUid: string
  status: RequestStatus
  requestedAt: unknown
  updatedAt: unknown
  certificateEvidenceRetained: boolean
}
type RetentionHold = { status: 'active' | 'released'; reason: string; updatedAt: unknown }
type RequestRecord = DeletionRequest & { hold: RetentionHold | null; hasCertificate: boolean }

const policyVersion = 'efbi-retention-v1'
const submissionIds = ['ai-foundations-project', 'ai-foundations-project-revision-1']

function safeString(value: unknown) { return typeof value === 'string' ? value : '' }
function readableDate(value: unknown) {
  if (!value || typeof value !== 'object') return 'Time unavailable'
  const timestamp = value as { toDate?: () => Date }
  return typeof timestamp.toDate === 'function' ? timestamp.toDate().toLocaleString() : 'Time unavailable'
}
function newAuditId(action: string) {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(8)), (value) => value.toString(16).padStart(2, '0')).join('')
  return 'retention-' + action + '-' + Date.now() + '-' + token
}
function asRequest(data: Record<string, unknown>): DeletionRequest {
  const rawStatus = safeString(data.status)
  const status: RequestStatus = rawStatus === 'cancelled' || rawStatus === 'held' || rawStatus === 'completed' ? rawStatus : 'requested'
  return {
    requestId: safeString(data.requestId), learnerUid: safeString(data.learnerUid), status,
    requestedAt: data.requestedAt, updatedAt: data.updatedAt,
    certificateEvidenceRetained: data.certificateEvidenceRetained === true,
  }
}

export default function RetentionManager({ user }: { user: User }) {
  const [records, setRecords] = useState<RequestRecord[]>([])
  const [selectedUid, setSelectedUid] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [holdReason, setHoldReason] = useState('')
  const [releaseReason, setReleaseReason] = useState('')
  const [typedUid, setTypedUid] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    let active = true
    let unsubscribe: () => void = () => undefined
    void getAdminFirebase().then((services) => {
      if (!active || !services) return
      const { collection, doc, getDoc, onSnapshot } = services.firestoreSdk
      unsubscribe = onSnapshot(collection(services.db, 'deletionRequests'), (snapshot) => {
        void Promise.all(snapshot.docs.map(async (item) => {
          const request = asRequest(item.data())
          const claimId = request.learnerUid + '--ai-foundations'
          const [holdSnapshot, claimSnapshot] = await Promise.all([
            getDoc(doc(services.db, 'retentionHolds', request.learnerUid)),
            getDoc(doc(services.db, 'certificateClaims', claimId)),
          ])
          const holdData = holdSnapshot.exists() ? holdSnapshot.data() : null
          const hold: RetentionHold | null = holdData ? {
            status: safeString(holdData.status) === 'active' ? 'active' : 'released',
            reason: safeString(holdData.reason), updatedAt: holdData.updatedAt,
          } : null
          return { ...request, hold, hasCertificate: claimSnapshot.exists() }
        })).then((next) => {
          if (!active) return
          next.sort((a, b) => a.status.localeCompare(b.status) || a.learnerUid.localeCompare(b.learnerUid))
          setRecords(next)
          setSelectedUid((current) => next.some((item) => item.learnerUid === current) ? current : next[0]?.learnerUid || '')
          setLoading(false)
        }).catch(() => { if (active) { setNotice({ kind: 'error', message: 'Privacy requests could not be loaded.' }); setLoading(false) } })
      }, () => { if (active) { setNotice({ kind: 'error', message: 'Privacy requests could not be loaded.' }); setLoading(false) } })
    }).catch(() => { if (active) { setNotice({ kind: 'error', message: 'Firebase could not start privacy operations.' }); setLoading(false) } })
    return () => { active = false; unsubscribe() }
  }, [])

  const selected = records.find((item) => item.learnerUid === selectedUid) ?? null
  function resetControls() { setHoldReason(''); setReleaseReason(''); setTypedUid(''); setConfirmed(false); setNotice(null) }
  function select(uid: string) { setSelectedUid(uid); resetControls() }

  async function placeHold(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || selected.status !== 'requested' || holdReason.trim().length < 20 || busy) return
    setBusy(true); setNotice(null)
    try {
      const services = await getAdminFirebase(); if (!services) throw new Error('Firebase configuration is missing.')
      const { doc, serverTimestamp, writeBatch } = services.firestoreSdk
      const auditId = newAuditId('hold-created'); const timestamp = serverTimestamp(); const reason = holdReason.trim()
      const batch = writeBatch(services.db)
      batch.set(doc(services.db, 'retentionHolds', selected.learnerUid), { holdId: selected.learnerUid, learnerUid: selected.learnerUid, status: 'active', reason, createdAt: timestamp, createdBy: user.uid, updatedAt: timestamp, updatedBy: user.uid, auditId })
      batch.update(doc(services.db, 'deletionRequests', selected.learnerUid), { status: 'held', updatedAt: timestamp })
      batch.set(doc(services.db, 'retentionAudit', auditId), { eventId: auditId, action: 'retention.hold.created', learnerUid: selected.learnerUid, actorUid: user.uid, reason, createdAt: timestamp })
      await batch.commit()
      setHoldReason(''); setNotice({ kind: 'success', message: 'The request is held with an immutable audit record.' })
    } catch { setNotice({ kind: 'error', message: 'The hold was rejected. Refresh the request and try again.' }) }
    finally { setBusy(false) }
  }

  async function releaseHold(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || selected.status !== 'held' || selected.hold?.status !== 'active' || releaseReason.trim().length < 20 || busy) return
    setBusy(true); setNotice(null)
    try {
      const services = await getAdminFirebase(); if (!services) throw new Error('Firebase configuration is missing.')
      const { doc, serverTimestamp, writeBatch } = services.firestoreSdk
      const auditId = newAuditId('hold-released'); const timestamp = serverTimestamp(); const reason = releaseReason.trim()
      const batch = writeBatch(services.db)
      batch.update(doc(services.db, 'retentionHolds', selected.learnerUid), { status: 'released', reason, updatedAt: timestamp, updatedBy: user.uid, auditId })
      batch.update(doc(services.db, 'deletionRequests', selected.learnerUid), { status: 'requested', updatedAt: timestamp })
      batch.set(doc(services.db, 'retentionAudit', auditId), { eventId: auditId, action: 'retention.hold.released', learnerUid: selected.learnerUid, actorUid: user.uid, reason, createdAt: timestamp })
      await batch.commit()
      setReleaseReason(''); setNotice({ kind: 'success', message: 'The hold was released and deletion may continue.' })
    } catch { setNotice({ kind: 'error', message: 'The release was rejected. Refresh the request and try again.' }) }
    finally { setBusy(false) }
  }

  async function completeDeletion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || selected.status !== 'requested' || selected.hold?.status === 'active' || typedUid !== selected.learnerUid || !confirmed || busy) return
    setBusy(true); setNotice(null)
    try {
      const services = await getAdminFirebase(); if (!services) throw new Error('Firebase configuration is missing.')
      const { doc, getDoc, serverTimestamp, writeBatch } = services.firestoreSdk
      const uid = selected.learnerUid; const claimId = uid + '--ai-foundations'
      const profileRef = doc(services.db, 'users', uid)
      const progressRef = doc(services.db, 'users', uid, 'progress', 'ai-foundations')
      const requestRef = doc(services.db, 'users', uid, 'certificateRequests', 'ai-foundations')
      const evidenceRefs = submissionIds.flatMap((submissionId) => {
        const resultId = uid + '--' + submissionId
        return [
          doc(services.db, 'users', uid, 'submissions', submissionId),
          doc(services.db, 'users', uid, 'reviewResults', resultId),
          doc(services.db, 'reviewResults', resultId),
          doc(services.db, 'reviewAssignments', resultId),
        ]
      })
      const claimSnapshot = await getDoc(doc(services.db, 'certificateClaims', claimId))
      const hasCertificate = claimSnapshot.exists()
      const candidates = hasCertificate ? [profileRef, progressRef] : [profileRef, progressRef, requestRef, ...evidenceRefs]
      const snapshots = await Promise.all(candidates.map((reference) => getDoc(reference)))
      const auditId = newAuditId('deletion-completed'); const timestamp = serverTimestamp()
      const deletedCategories = hasCertificate
        ? ['profile', 'courseProgress']
        : ['profile', 'courseProgress', 'projectSubmissions', 'reviewRecords', 'certificateRequest']
      const batch = writeBatch(services.db)
      snapshots.forEach((snapshot, index) => { if (snapshot.exists()) batch.delete(candidates[index]) })
      batch.update(doc(services.db, 'deletionRequests', uid), { status: 'completed', updatedAt: timestamp, completedAt: timestamp, certificateEvidenceRetained: hasCertificate })
      batch.set(doc(services.db, 'deletionCompletions', uid), { completionId: uid, learnerUid: uid, policyVersion, completedAt: timestamp, certificateEvidenceRetained: hasCertificate, authenticationRemoval: 'manual-console-required', deletedCategories, auditId })
      batch.set(doc(services.db, 'retentionAudit', auditId), { eventId: auditId, action: 'deletion.completed', learnerUid: uid, actorUid: user.uid, reason: hasCertificate ? 'Eligible learner data deleted; certificate-linked evidence retained for credential integrity.' : 'Eligible learner data deleted; no certificate-linked evidence required retention.', createdAt: timestamp })
      await batch.commit()
      setTypedUid(''); setConfirmed(false)
      setNotice({ kind: 'success', message: 'Firestore deletion is complete. Now remove this exact UID from Firebase Authentication.' })
    } catch { setNotice({ kind: 'error', message: 'Deletion was rejected. No partial completion was recorded. Refresh and recheck the request.' }) }
    finally { setBusy(false) }
  }

  return <section className="retention-workspace"><header className="workspace-title"><div><p className="eyebrow">Phase 19 · Privacy operations</p><h1>Process deletion requests safely</h1><p>Protect learner rights without erasing certificate proof or investigation evidence.</p></div><span className="security-badge">Administrator access</span></header>{notice && <div className={'notice notice--' + notice.kind} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.message}</div>}<div className="retention-layout">
    <aside className="retention-list"><div><strong>Privacy requests</strong><span>{records.length}</span></div>{loading && <p>Loading restricted requests…</p>}{!loading && !records.length && <p>No deletion request is waiting.</p>}{records.map((item) => <button key={item.learnerUid} className={selectedUid === item.learnerUid ? 'selected' : ''} onClick={() => select(item.learnerUid)}><strong>{item.learnerUid}</strong><span>Requested {readableDate(item.requestedAt)}</span><small className={'retention-state retention-state--' + item.status}>{item.status}</small></button>)}</aside>
    <main className="retention-record">{!selected ? <div className="retention-empty"><strong>Select a privacy request.</strong><p>Its status and protected actions will appear here.</p></div> : <><header><div><p className="eyebrow">Learner UID</p><h2>{selected.learnerUid}</h2><p>Last changed {readableDate(selected.updatedAt)}</p></div><span className={'retention-state retention-state--' + selected.status}>{selected.status}</span></header><dl><div><dt>Scope</dt><dd>Account and learning data</dd></div><div><dt>Policy</dt><dd>{policyVersion}</dd></div><div><dt>Certificate claim</dt><dd>{selected.hasCertificate ? 'Exists — proof must remain' : 'None found'}</dd></div><div><dt>Retention hold</dt><dd>{selected.hold?.status || 'None'}</dd></div></dl>{selected.hold?.status === 'active' && <section className="retention-private"><strong>Private hold reason</strong><p>{selected.hold.reason}</p></section>}{selected.status === 'completed' && <section className="retention-complete"><strong>Firestore processing complete</strong><p>Remove only this exact UID from Firebase Authentication, then keep the immutable completion and audit records.</p></section>}</>}</main>
    <aside className="retention-actions"><p className="eyebrow">Protected action</p>{!selected && <p>Choose a request to continue.</p>}{selected?.status === 'requested' && <><form onSubmit={(event) => void placeHold(event)}><h2>Place a hold</h2><p>Use only for a documented legal, safety, fraud, or record-integrity need.</p><label>Private reason<textarea value={holdReason} onChange={(event) => setHoldReason(event.target.value)} minLength={20} maxLength={500} required /></label><button className="secondary-action" disabled={busy || holdReason.trim().length < 20}>Place audited hold</button></form><form onSubmit={(event) => void completeDeletion(event)}><h2>Complete deletion</h2><p>Deletes eligible Firestore data atomically. Certificate-linked evidence remains when a credential exists.</p><label>Type the learner UID<input value={typedUid} onChange={(event) => { setTypedUid(event.target.value); setConfirmed(false) }} autoComplete="off" required /></label><label className="retention-confirm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>I checked the exact UID, certificate status, and absence of an active hold.</span></label><button className="danger-action" disabled={busy || typedUid !== selected.learnerUid || !confirmed}>{busy ? 'Processing…' : 'Delete eligible Firestore data'}</button></form></>}{selected?.status === 'held' && <form onSubmit={(event) => void releaseHold(event)}><h2>Release the hold</h2><p>Record why the restriction is no longer needed. The request returns to processing.</p><label>Private release reason<textarea value={releaseReason} onChange={(event) => setReleaseReason(event.target.value)} minLength={20} maxLength={500} required /></label><button className="primary-action" disabled={busy || releaseReason.trim().length < 20}>{busy ? 'Releasing…' : 'Release with audit record'}</button></form>}{selected?.status === 'cancelled' && <div className="retention-locked"><strong>Learner cancelled</strong><p>No administrator action is allowed. The learner may reopen the request from their account.</p></div>}{selected?.status === 'completed' && <div className="retention-boundary"><strong>Manual Authentication step</strong><p>In Firebase Console, delete only the user matching this UID. Never use a shared credential or service-account key in this browser studio.</p></div>}<div className="retention-boundary"><strong>Permanent boundary</strong><p>Certificate records, public verification, deletion completions, and audit history are never deleted by this workflow.</p></div></aside>
  </div></section>
}
