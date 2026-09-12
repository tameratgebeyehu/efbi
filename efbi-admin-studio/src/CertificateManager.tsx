import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { getAdminFirebase } from './firebase'
import './certificate.css'

type RequestRecord = {
  requestId: string; learnerUid: string; courseId: string; publicName: string; finalReviewId: string; submissionId: string
  courseVersion: number; assessmentVersion: number; reviewedAt: unknown; createdAt: unknown
}
type CredentialRecord = {
  credentialId: string; status: 'active' | 'revoked' | 'replaced'; issuedAt: unknown; replacedBy: string; replacesCredentialId: string
}
type RequestWithCredential = RequestRecord & { credential: CredentialRecord | null }

const courseTitle = 'AI Foundations for Ethiopia'

function safeString(value: unknown) { return typeof value === 'string' ? value : '' }
function safeNumber(value: unknown) { return typeof value === 'number' ? value : 0 }
function readableDate(value: unknown) {
  if (!value || typeof value !== 'object') return 'Time unavailable'
  const timestamp = value as { toDate?: () => Date }
  return typeof timestamp.toDate === 'function' ? timestamp.toDate().toLocaleString() : 'Time unavailable'
}
function asRequest(learnerUid: string, data: Record<string, unknown>): RequestRecord {
  return { requestId: safeString(data.requestId), learnerUid, courseId: safeString(data.courseId), publicName: safeString(data.publicName), finalReviewId: safeString(data.finalReviewId), submissionId: safeString(data.submissionId), courseVersion: safeNumber(data.courseVersion), assessmentVersion: safeNumber(data.assessmentVersion), reviewedAt: data.reviewedAt, createdAt: data.createdAt }
}
function randomToken(length: number) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('')
}
function newCredentialId() { return `EFBI-${new Date().getFullYear()}-${randomToken(12)}` }
function newAuditId(action: string) { return `certificate-${action}-${Date.now()}-${randomToken(10)}` }

export default function CertificateManager({ user }: { user: User }) {
  const [records, setRecords] = useState<RequestWithCredential[]>([])
  const [selectedUid, setSelectedUid] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [issueConfirmed, setIssueConfirmed] = useState(false)
  const [revokeReason, setRevokeReason] = useState('')
  const [revokeConfirmed, setRevokeConfirmed] = useState(false)
  const [replacementReason, setReplacementReason] = useState('')
  const [replacementConfirmed, setReplacementConfirmed] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    let active = true
    let unsubscribe: () => void = () => undefined
    void getAdminFirebase().then((services) => {
      if (!active || !services) return
      const { collectionGroup, doc, getDoc, onSnapshot } = services.firestoreSdk
      unsubscribe = onSnapshot(collectionGroup(services.db, 'certificateRequests'), (snapshot) => {
        void Promise.all(snapshot.docs.map(async (item) => {
          const learnerUid = item.ref.parent.parent?.id ?? ''
          const request = asRequest(learnerUid, item.data())
          const claimSnapshot = await getDoc(doc(services.db, 'certificateClaims', `${learnerUid}--${request.courseId}`))
          if (!claimSnapshot.exists()) return { ...request, credential: null }
          const credentialId = safeString(claimSnapshot.data().currentCredentialId)
          const [certificateSnapshot, statusSnapshot] = await Promise.all([
            getDoc(doc(services.db, 'certificateIssuances', credentialId)),
            getDoc(doc(services.db, 'certificateStatuses', credentialId)),
          ])
          if (!certificateSnapshot.exists() || !statusSnapshot.exists()) return { ...request, credential: null }
          const status = safeString(statusSnapshot.data().status)
          const normalizedStatus: CredentialRecord['status'] = status === 'revoked' || status === 'replaced' ? status : 'active'
          return { ...request, credential: { credentialId, status: normalizedStatus, issuedAt: certificateSnapshot.data().issuedAt, replacedBy: safeString(statusSnapshot.data().replacedBy), replacesCredentialId: safeString(certificateSnapshot.data().replacesCredentialId) } }
        })).then((next) => {
          if (!active) return
          next.sort((a, b) => a.publicName.localeCompare(b.publicName))
          setRecords(next); setSelectedUid((current) => next.some((item) => item.learnerUid === current) ? current : next[0]?.learnerUid || ''); setLoading(false)
        }).catch(() => { if (active) { setNotice({ kind: 'error', message: 'Certificate requests could not be loaded.' }); setLoading(false) } })
      }, () => { if (active) { setNotice({ kind: 'error', message: 'Certificate requests could not be loaded.' }); setLoading(false) } })
    }).catch(() => { if (active) { setNotice({ kind: 'error', message: 'Firebase could not start certificate operations.' }); setLoading(false) } })
    return () => { active = false; unsubscribe() }
  }, [])

  const selected = records.find((item) => item.learnerUid === selectedUid) ?? null

  function updateSelectedCredential(credential: CredentialRecord) {
    setRecords((current) => current.map((item) => item.learnerUid === selectedUid ? { ...item, credential } : item))
  }

  function resetControls() { setIssueConfirmed(false); setRevokeReason(''); setRevokeConfirmed(false); setReplacementReason(''); setReplacementConfirmed(false); setNotice(null) }
  function select(uid: string) { setSelectedUid(uid); resetControls() }

  async function writeIssuance(request: RequestRecord, replacesCredentialId: string, reason: string) {
    const services = await getAdminFirebase(); if (!services) throw new Error('Firebase configuration is missing.')
    const { doc, serverTimestamp, writeBatch } = services.firestoreSdk
    const credentialId = newCredentialId()
    const action = replacesCredentialId ? 'replaced' : 'issued'
    const auditId = newAuditId(action)
    const claimId = `${request.learnerUid}--${request.courseId}`
    const timestamp = serverTimestamp()
    const issuance = {
      credentialId, claimId, learnerUid: request.learnerUid, publicName: request.publicName, courseId: request.courseId,
      courseTitle, finalReviewId: request.finalReviewId, submissionId: request.submissionId, courseVersion: request.courseVersion,
      assessmentVersion: request.assessmentVersion, reviewedAt: request.reviewedAt, issuedAt: timestamp, issuedBy: user.uid,
      auditId, replacesCredentialId,
    }
    const batch = writeBatch(services.db)
    batch.set(doc(services.db, 'certificateIssuances', credentialId), issuance)
    batch.set(doc(services.db, 'certificates', credentialId), { credentialId, publicName: request.publicName, courseId: request.courseId, courseTitle, issuedAt: timestamp, replacesCredentialId })
    batch.set(doc(services.db, 'certificateStatuses', credentialId), { credentialId, status: 'active', updatedAt: timestamp, replacedBy: '', lastAuditId: auditId })
    if (replacesCredentialId) {
      batch.update(doc(services.db, 'certificateClaims', claimId), { currentCredentialId: credentialId, updatedAt: timestamp, lastAuditId: auditId })
      batch.update(doc(services.db, 'certificateStatuses', replacesCredentialId), { status: 'replaced', updatedAt: timestamp, replacedBy: credentialId, lastAuditId: auditId })
    } else {
      batch.set(doc(services.db, 'certificateClaims', claimId), { claimId, learnerUid: request.learnerUid, courseId: request.courseId, currentCredentialId: credentialId, createdAt: timestamp, updatedAt: timestamp, lastAuditId: auditId })
    }
    batch.set(doc(services.db, 'certificateAudit', auditId), { eventId: auditId, action: `certificate.${action}`, credentialId: replacesCredentialId || credentialId, replacementCredentialId: replacesCredentialId ? credentialId : '', learnerUid: request.learnerUid, actorUid: user.uid, reason, createdAt: timestamp })
    await batch.commit()
    return credentialId
  }

  async function issue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected || selected.credential || !issueConfirmed) return
    setBusy(true); setNotice(null)
    try {
      const id = await writeIssuance(selected, '', 'Initial certificate issuance after approved review and learner consent.')
      updateSelectedCredential({ credentialId: id, status: 'active', issuedAt: { toDate: () => new Date() }, replacedBy: '', replacesCredentialId: '' })
      setNotice({ kind: 'success', message: `Certificate ${id} was issued with an immutable audit record.` }); setIssueConfirmed(false)
    }
    catch { setNotice({ kind: 'error', message: 'Issuance was rejected. Recheck the approved review and learner request.' }) }
    finally { setBusy(false) }
  }

  async function revoke(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected?.credential || selected.credential.status !== 'active' || revokeReason.trim().length < 10 || !revokeConfirmed) return
    setBusy(true); setNotice(null)
    try {
      const services = await getAdminFirebase(); if (!services) throw new Error('Firebase configuration is missing.')
      const { doc, serverTimestamp, writeBatch } = services.firestoreSdk
      const auditId = newAuditId('revoked'); const timestamp = serverTimestamp(); const batch = writeBatch(services.db)
      batch.update(doc(services.db, 'certificateStatuses', selected.credential.credentialId), { status: 'revoked', updatedAt: timestamp, replacedBy: '', lastAuditId: auditId })
      batch.set(doc(services.db, 'certificateAudit', auditId), { eventId: auditId, action: 'certificate.revoked', credentialId: selected.credential.credentialId, replacementCredentialId: '', learnerUid: selected.learnerUid, actorUid: user.uid, reason: revokeReason.trim(), createdAt: timestamp })
      await batch.commit()
      updateSelectedCredential({ ...selected.credential, status: 'revoked', replacedBy: '' })
      setNotice({ kind: 'success', message: 'The credential is now revoked. Its original issuance remains preserved.' }); setRevokeReason(''); setRevokeConfirmed(false)
    } catch { setNotice({ kind: 'error', message: 'Revocation was rejected. Refresh the current status and try again.' }) }
    finally { setBusy(false) }
  }

  async function replace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected?.credential || selected.credential.status !== 'active' || replacementReason.trim().length < 10 || !replacementConfirmed) return
    setBusy(true); setNotice(null)
    try {
      const replacedId = selected.credential.credentialId
      const id = await writeIssuance(selected, replacedId, replacementReason.trim())
      updateSelectedCredential({ credentialId: id, status: 'active', issuedAt: { toDate: () => new Date() }, replacedBy: '', replacesCredentialId: replacedId })
      setNotice({ kind: 'success', message: `Replacement ${id} is active. The previous credential now points to it.` }); setReplacementReason(''); setReplacementConfirmed(false)
    }
    catch { setNotice({ kind: 'error', message: 'Replacement was rejected. Refresh the current status and try again.' }) }
    finally { setBusy(false) }
  }

  return <section className="certificate-workspace"><header className="workspace-title"><div><p className="eyebrow">Phase 18 · Certificates</p><h1>Issue verified credentials</h1><p>Every action requires approved work, learner consent, and permanent audit evidence.</p></div><span className="security-badge">Administrator access</span></header>{notice && <div className={`notice notice--${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.message}</div>}<div className="certificate-layout-admin">
    <aside className="certificate-list"><div><strong>Eligible requests</strong><span>{records.length}</span></div>{loading && <p>Loading protected requests…</p>}{!loading && !records.length && <p>No learner has requested a certificate.</p>}{records.map((item) => <button key={item.learnerUid} className={selectedUid === item.learnerUid ? 'selected' : ''} onClick={() => select(item.learnerUid)}><strong>{item.publicName}</strong><span>{item.courseId}</span><small>{item.credential ? item.credential.status : 'Ready to issue'}</small></button>)}</aside>
    <main className="certificate-record-admin">{!selected ? <div className="certificate-empty"><strong>Select a certificate request.</strong><p>The approved review binding and public name will appear here.</p></div> : <><header><div><p className="eyebrow">Learner-authorized public name</p><h2>{selected.publicName}</h2><p>Requested {readableDate(selected.createdAt)}</p></div><span className={`certificate-state certificate-state--${selected.credential?.status || 'requested'}`}>{selected.credential?.status || 'requested'}</span></header><dl><div><dt>Learner ID</dt><dd>{selected.learnerUid}</dd></div><div><dt>Final review</dt><dd>{selected.finalReviewId}</dd></div><div><dt>Submission</dt><dd>{selected.submissionId}</dd></div><div><dt>Review time</dt><dd>{readableDate(selected.reviewedAt)}</dd></div><div><dt>Course version</dt><dd>{selected.courseVersion}</dd></div><div><dt>Assessment version</dt><dd>{selected.assessmentVersion}</dd></div></dl>{selected.credential && <section className="current-credential"><p className="eyebrow">Current credential</p><h3>{selected.credential.credentialId}</h3><p>Issued {readableDate(selected.credential.issuedAt)}</p>{selected.credential.replacesCredentialId && <p>Replaces {selected.credential.replacesCredentialId}</p>}<a href={`http://127.0.0.1:5173/verify?credential=${encodeURIComponent(selected.credential.credentialId)}`} target="_blank" rel="noreferrer">Open public verification ↗</a></section>}</>}</main>
    <aside className="certificate-actions"><p className="eyebrow">Protected action</p>{!selected && <p>Choose a request to continue.</p>}{selected && !selected.credential && <form onSubmit={(event) => void issue(event)}><h2>Issue certificate</h2><p>This publishes only the chosen name, course, issue date, credential ID, and status.</p><label className="certificate-confirm"><input type="checkbox" checked={issueConfirmed} onChange={(event) => setIssueConfirmed(event.target.checked)} /><span>I checked the final approved review and learner’s public-name consent. This issuance is permanent.</span></label><button className="primary-action" disabled={busy || !issueConfirmed}>{busy ? 'Issuing…' : 'Issue audited certificate'}</button></form>}{selected?.credential?.status === 'active' && <><form onSubmit={(event) => void revoke(event)}><h2>Revoke credential</h2><p>Use only when this credential must no longer be valid. History is preserved.</p><label>Private reason<textarea value={revokeReason} onChange={(event) => { setRevokeReason(event.target.value); setRevokeConfirmed(false) }} minLength={10} maxLength={500} required /></label><label className="certificate-confirm"><input type="checkbox" checked={revokeConfirmed} onChange={(event) => setRevokeConfirmed(event.target.checked)} /><span>I understand revocation is permanent and publicly visible.</span></label><button className="danger-action" disabled={busy || revokeReason.trim().length < 10 || !revokeConfirmed}>Revoke permanently</button></form><form onSubmit={(event) => void replace(event)}><h2>Replace credential</h2><p>A new ID becomes active. The old ID remains verifiable as replaced.</p><label>Private replacement reason<textarea value={replacementReason} onChange={(event) => { setReplacementReason(event.target.value); setReplacementConfirmed(false) }} minLength={10} maxLength={500} required /></label><label className="certificate-confirm"><input type="checkbox" checked={replacementConfirmed} onChange={(event) => setReplacementConfirmed(event.target.checked)} /><span>I checked the public name and understand the old credential cannot become active again.</span></label><button className="secondary-action" disabled={busy || replacementReason.trim().length < 10 || !replacementConfirmed}>{busy ? 'Replacing…' : 'Create replacement'}</button></form></>}{selected?.credential && selected.credential.status !== 'active' && <div className="certificate-locked"><strong>No further browser action</strong><p>This credential is permanently {selected.credential.status}. Its history remains available for verification and audit.</p></div>}<div className="certificate-boundary"><strong>Permanent boundary</strong><p>Core certificates and issuance evidence never change. Status transitions require a matching audit event in the same atomic operation.</p></div></aside>
  </div></section>
}
