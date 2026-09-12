import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHero } from './components'
import { Icon } from './icons'
import { normalizeCredentialId, validCredentialId, verifyCertificate, type CertificateVerification } from './lib/certificate'

type VerifyState = 'idle' | 'checking' | 'found' | 'not-found' | 'error'

function readableDate(value: unknown) {
  if (!value || typeof value !== 'object') return 'Date unavailable'
  const timestamp = value as { toDate?: () => Date }
  return typeof timestamp.toDate === 'function' ? timestamp.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date unavailable'
}

export function VerifyPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialId = normalizeCredentialId(searchParams.get('credential') ?? '')
  const [credentialId, setCredentialId] = useState(initialId)
  const [state, setState] = useState<VerifyState>(validCredentialId(initialId) ? 'checking' : 'idle')
  const [result, setResult] = useState<CertificateVerification | null>(null)
  const [message, setMessage] = useState('')

  async function check(value: string) {
    const normalized = normalizeCredentialId(value)
    setCredentialId(normalized); setResult(null); setMessage('')
    if (!validCredentialId(normalized)) { setState('error'); setMessage('Enter the complete credential ID exactly as shown on the certificate.'); return }
    setState('checking')
    try {
      const found = await verifyCertificate(normalized)
      setResult(found); setState(found ? 'found' : 'not-found')
      setSearchParams({ credential: normalized }, { replace: true })
    } catch { setState('error'); setMessage('Verification could not connect. Check your internet connection and try again.') }
  }

  useEffect(() => {
    if (!validCredentialId(initialId)) return
    let active = true
    void verifyCertificate(initialId).then((found) => {
      if (!active) return
      setCredentialId(initialId); setResult(found); setState(found ? 'found' : 'not-found')
      setSearchParams({ credential: initialId }, { replace: true })
    }).catch(() => {
      if (!active) return
      setState('error'); setMessage('Verification could not connect. Check your internet connection and try again.')
    })
    return () => { active = false }
  }, [initialId, setSearchParams])

  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void check(credentialId) }
  const status = result?.status.status

  return <><PageHero eyebrow="Certificate verification" title="Check an EFBI certificate." description="Enter the credential ID to confirm its public record and current status." className="page-hero--verify" /><section className="section shell verify-layout"><div className="verify-card"><div className="verify-icon"><Icon name="shield" /></div><h2>Verify a credential</h2><p>Use the complete ID. EFBI never asks for a password, email address, payment, or project file to verify a certificate.</p><form onSubmit={submit}><label htmlFor="certificate-id">Credential ID</label><div className="verify-form"><input id="certificate-id" value={credentialId} onChange={(event) => { setCredentialId(event.target.value.toUpperCase()); setState('idle'); setResult(null); setMessage('') }} placeholder="EFBI-2026-XXXXXXXXXXXX" maxLength={22} autoComplete="off" spellCheck={false} /><button className="button button--primary" disabled={state === 'checking'}>{state === 'checking' ? 'Checking…' : 'Verify'}</button></div></form>{message && <p className="verify-message verify-message--error" role="alert">{message}</p>}{state === 'not-found' && <div className="verification-result verification-result--not-found" role="status"><strong>No matching EFBI credential was found.</strong><p>Check every letter and number. Do not treat an image or PDF alone as proof.</p></div>}{result && <div className={`verification-result verification-result--${status}`} role="status"><div><span className="verification-status"><Icon name={status === 'active' ? 'check' : 'shield'} />{status === 'active' ? 'Valid certificate' : status === 'replaced' ? 'Certificate replaced' : 'Certificate revoked'}</span><h3>{result.certificate.publicName}</h3><p>{result.certificate.courseTitle}</p></div><dl><div><dt>Credential ID</dt><dd>{result.certificate.credentialId}</dd></div><div><dt>Issued</dt><dd>{readableDate(result.certificate.issuedAt)}</dd></div><div><dt>Current status</dt><dd>{status}</dd></div>{result.certificate.replacesCredentialId && <div><dt>Replaces</dt><dd>{result.certificate.replacesCredentialId}</dd></div>}{result.status.replacedBy && <div><dt>Replacement</dt><dd><Link to={`/verify?credential=${encodeURIComponent(result.status.replacedBy)}`}>{result.status.replacedBy}</Link></dd></div>}</dl>{status !== 'active' && <p className="verification-warning">This credential is not currently valid. Its record remains visible so the history cannot be hidden.</p>}<small>Public verification does not reveal an email, user ID, project, score, reviewer, private note, or administrative reason.</small></div>}</div><aside className="verification-info"><p className="eyebrow-label">What this proves</p><ul><li><Icon name="check" /><span><strong>Issued by EFBI</strong>The credential ID exists in the protected registry.</span></li><li><Icon name="check" /><span><strong>Current status</strong>Active, replaced, or revoked.</span></li><li><Icon name="check" /><span><strong>Public details only</strong>The learner-approved name, course, and issue date.</span></li></ul></aside></section></>
}
