import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './icons'
import {
  createCertificateRequest,
  readCertificateRequest,
  readOwnCertificateClaim,
  type CertificateClaim,
  type CertificateRequest,
} from './lib/certificate'
import type { LearnerReviewResult } from './lib/submission'

export function CertificateRequestPanel({ uid, defaultName, result }: { uid: string; defaultName: string; result: LearnerReviewResult }) {
  const [request, setRequest] = useState<CertificateRequest | null>(null)
  const [claim, setClaim] = useState<CertificateClaim | null>(null)
  const [name, setName] = useState(defaultName)
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void Promise.all([readCertificateRequest(uid), readOwnCertificateClaim(uid)]).then(([savedRequest, savedClaim]) => {
      if (!active) return
      setRequest(savedRequest); setClaim(savedClaim)
      if (savedRequest) setName(savedRequest.publicName)
    }).catch(() => { if (active) setError('Certificate information could not be loaded. Try refreshing this page.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [uid])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!consent || busy) return
    setBusy(true); setError('')
    try {
      const saved = await createCertificateRequest(uid, name, result)
      setRequest(saved); setConsent(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The certificate request could not be saved.')
    } finally { setBusy(false) }
  }

  if (loading) return <section className="certificate-request"><div className="submission-spinner" /><p>Checking certificate eligibility…</p></section>
  if (claim) return <section className="certificate-request certificate-request--issued"><Icon name="shield" /><div><p className="eyebrow-label">Certificate issued</p><h2>Your credential is ready.</h2><p>Your public certificate name is <strong>{request?.publicName || name}</strong>.</p><Link className="button button--primary" to={`/verify?credential=${encodeURIComponent(claim.currentCredentialId)}`}>Verify credential</Link></div></section>
  if (request) return <section className="certificate-request certificate-request--waiting"><Icon name="check" /><div><p className="eyebrow-label">Certificate requested</p><h2>EFBI will check and issue it.</h2><p>The public verification record will show <strong>{request.publicName}</strong>, the course, issue date, credential ID, and current status. Your project and review details stay private.</p><small>Refresh this page after an administrator completes issuance.</small></div></section>

  return <section className="certificate-request"><div><p className="eyebrow-label">Approved project</p><h2>Request your EFBI certificate.</h2><p>Choose the name that may appear publicly when someone verifies your credential.</p></div><form onSubmit={(event) => void submit(event)}><label>Public certificate name<input value={name} onChange={(event) => { setName(event.target.value); setConsent(false) }} minLength={2} maxLength={80} autoComplete="name" required /></label><label className="submission-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span><strong>I agree to publish this certificate name.</strong>Anyone with my credential ID may see this name, the course, issue date, and certificate status. My project, scores, email, user ID, and reviewer information stay private.</span></label>{error && <p className="form-status form-status--error" role="alert">{error}</p>}<button className="button button--primary" disabled={busy || !consent || name.trim().length < 2}>{busy ? 'Saving request…' : 'Request certificate'}</button></form></section>
}
