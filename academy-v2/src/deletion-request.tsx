import { useEffect, useState } from 'react'
import { Icon } from './icons'
import {
  createDeletionRequest,
  readDeletionState,
  setDeletionRequestActive,
  type DataDeletionRequest,
  type DeletionCompletion,
} from './lib/deletion'

function readableDate(value: unknown) {
  if (!value || typeof value !== 'object') return 'Time unavailable'
  const timestamp = value as { toDate?: () => Date }
  return typeof timestamp.toDate === 'function' ? timestamp.toDate().toLocaleString() : 'Time unavailable'
}

export function DeletionRequestPanel({ uid, onCompleted }: { uid: string; onCompleted?: () => void }) {
  const [request, setRequest] = useState<DataDeletionRequest | null>(null)
  const [completion, setCompletion] = useState<DeletionCompletion | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void readDeletionState(uid).then((state) => {
      if (!active) return
      setRequest(state.request); setCompletion(state.completion)
      if (state.request?.status === 'completed') onCompleted?.()
    }).catch(() => { if (active) setError('Your privacy-request status could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [onCompleted, uid])

  async function requestDeletion() {
    if (!confirm || busy) return
    setBusy(true); setError('')
    try {
      const state = request?.status === 'cancelled'
        ? await setDeletionRequestActive(uid, true)
        : await createDeletionRequest(uid)
      setRequest(state.request); setCompletion(state.completion); setConfirm(false)
    } catch { setError('The deletion request could not be saved. Refresh and try again.') }
    finally { setBusy(false) }
  }

  async function cancelRequest() {
    if (busy) return
    setBusy(true); setError('')
    try {
      const state = await setDeletionRequestActive(uid, false)
      setRequest(state.request); setConfirm(false)
    } catch { setError('The request could not be cancelled. It may already be under review.') }
    finally { setBusy(false) }
  }

  if (loading) return <section className="privacy-panel"><div className="submission-spinner" /><p>Checking your privacy-request status…</p></section>

  if (completion || request?.status === 'completed') {
    return <section className="privacy-panel privacy-panel--complete"><Icon name="check" /><div><p className="eyebrow-label">Deletion completed</p><h2>Your EFBI learning data was processed.</h2><p>Completed {readableDate(completion?.completedAt ?? request?.completedAt)}. {completion?.certificateEvidenceRetained ? 'Minimum certificate evidence remains so your credential can still be verified.' : 'No certificate evidence needed to be retained.'}</p><p>EFBI must also remove the separate sign-in account through Firebase Authentication. Contact EFBI if you can still sign in after receiving completion confirmation.</p></div></section>
  }

  if (request?.status === 'held') {
    return <section className="privacy-panel privacy-panel--held"><Icon name="shield" /><div><p className="eyebrow-label">Processing restricted</p><h2>Your request is on a documented hold.</h2><p>EFBI has paused ordinary processing while an authorized administrator resolves the hold. Your learning data cannot be changed during this period.</p></div></section>
  }

  if (request?.status === 'requested') {
    return <section className="privacy-panel privacy-panel--pending"><Icon name="shield" /><div><p className="eyebrow-label">Deletion requested</p><h2>Your learning data is now restricted.</h2><p>Requested {readableDate(request.requestedAt)}. EFBI will review the request without charging a fee. New learning changes are paused while it is pending.</p>{error && <p className="form-status form-status--error" role="alert">{error}</p>}<button className="text-button" type="button" disabled={busy} onClick={() => void cancelRequest()}>{busy ? 'Cancelling…' : 'Cancel this request'}</button></div></section>
  }

  return <section className="privacy-panel"><div><p className="eyebrow-label">Privacy request</p><h2>Request deletion of your learning data.</h2><p>This asks EFBI to remove your profile, progress, and eligible project records. If EFBI issued a certificate, minimum evidence may remain so the credential history cannot be falsified or erased.</p><ul><li>Your account stops accepting new learning changes while the request is active.</li><li>An authorized hold may delay deletion when evidence must be protected.</li><li>Firebase sign-in removal is confirmed separately after Firestore data is processed.</li></ul></div><div className="privacy-panel__action"><label className="submission-consent"><input type="checkbox" checked={confirm} onChange={(event) => setConfirm(event.target.checked)} /><span><strong>I want EFBI to review this deletion request.</strong>I understand that certificate proof and legally necessary records may need to remain.</span></label>{error && <p className="form-status form-status--error" role="alert">{error}</p>}<button className="button button--outline" type="button" disabled={busy || !confirm} onClick={() => void requestDeletion()}>{busy ? 'Saving request…' : request?.status === 'cancelled' ? 'Reopen deletion request' : 'Request data deletion'}</button></div></section>
}
