import { useEffect, useState, type FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { getAdminFirebase } from './firebase'

type EnrollmentState = {
  open: boolean
  minAge: number
  updatedBy: string
  updatedAt?: { toDate?: () => Date }
}

function readableDate(value: EnrollmentState['updatedAt']) {
  return value?.toDate ? value.toDate().toLocaleString() : 'Not changed yet'
}

export default function EnrollmentManager({ user }: { user: User }) {
  const [settings, setSettings] = useState<EnrollmentState>({ open: false, minAge: 12, updatedBy: '' })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [phrase, setPhrase] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    let active = true
    let unsubscribe: () => void = () => undefined
    void getAdminFirebase().then((services) => {
      if (!active || !services) return
      unsubscribe = onSnapshot(doc(services.db, 'publicSettings', 'enrollment'), (snapshot) => {
        if (!active) return
        if (snapshot.exists()) setSettings(snapshot.data() as EnrollmentState)
        else setSettings({ open: false, minAge: 12, updatedBy: '' })
        setLoading(false)
      }, () => {
        if (active) {
          setNotice({ kind: 'error', message: 'Enrollment status could not be loaded.' })
          setLoading(false)
        }
      })
    }).catch(() => {
      if (active) {
        setNotice({ kind: 'error', message: 'Firebase could not start the enrollment controls.' })
        setLoading(false)
      }
    })
    return () => { active = false; unsubscribe() }
  }, [])

  async function changeEnrollment(event: FormEvent<HTMLFormElement>, open: boolean) {
    event.preventDefault()
    setNotice(null)
    if (open && (phrase !== 'OPEN ENROLLMENT' || !confirmed)) {
      setNotice({ kind: 'error', message: 'Type OPEN ENROLLMENT and confirm the safety check before opening.' })
      return
    }
    setBusy(true)
    try {
      const services = await getAdminFirebase()
      if (!services) throw new Error('Firebase configuration is missing.')
      await setDoc(doc(services.db, 'publicSettings', 'enrollment'), {
        open,
        minAge: 12,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      })
      setPhrase('')
      setConfirmed(false)
      setNotice({ kind: 'success', message: open ? 'Enrollment is open at the server boundary.' : 'Enrollment is closed at the server boundary.' })
    } catch {
      setNotice({ kind: 'error', message: 'The enrollment setting was not changed. Confirm this account still has administrator access.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="enrollment-workspace">
      <header className="workspace-title"><div><p className="eyebrow">Phase 22 · Launch control</p><h1>Enrollment safety switch</h1><p>The student website and the Firestore server boundary must both permit registration. The public preview remains read-only even if this switch is open.</p></div><span className={settings.open ? 'security-badge enrollment-badge--open' : 'security-badge'}>{loading ? 'Checking…' : settings.open ? 'Enrollment open' : 'Enrollment closed'}</span></header>
      {notice && <p className={'notice notice--' + notice.kind} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.message}</p>}
      <section className="enrollment-state">
        <div><small>Server state</small><strong>{loading ? 'Loading' : settings.open ? 'Open' : 'Closed'}</strong><p>{settings.open ? 'A separately approved enrollment-enabled website build may create learner profiles.' : 'Learner profile creation is denied by Firestore rules.'}</p></div>
        <dl><div><dt>Minimum age</dt><dd>{settings.minAge}+</dd></div><div><dt>Last change</dt><dd>{readableDate(settings.updatedAt)}</dd></div><div><dt>Changed by UID</dt><dd>{settings.updatedBy || 'No administrator change recorded'}</dd></div></dl>
      </section>
      {settings.open ? (
        <form className="enrollment-action enrollment-action--close" onSubmit={(event) => void changeEnrollment(event, false)}>
          <div><p className="eyebrow">Recommended safe state</p><h2>Close enrollment</h2><p>Use this immediately whenever registration should pause. Existing authorized accounts can still be managed locally.</p></div>
          <button className="danger-action" disabled={busy || loading}>{busy ? 'Closing…' : 'Close enrollment now'}</button>
        </form>
      ) : (
        <form className="enrollment-action" onSubmit={(event) => void changeEnrollment(event, true)}>
          <div><p className="eyebrow">Protected action</p><h2>Open enrollment</h2><p>Do this only after the age, privacy, support, and production checks are complete. Opening this switch alone does not publish an enrollment-enabled website.</p></div>
          <label>Type OPEN ENROLLMENT<input value={phrase} onChange={(event) => { setPhrase(event.target.value); setConfirmed(false) }} autoComplete="off" /></label>
          <label className="confirm-check"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>I checked the launch gate and understand that this changes the server authorization boundary.</span></label>
          <button className="primary-action" disabled={busy || loading || phrase !== 'OPEN ENROLLMENT' || !confirmed}>{busy ? 'Opening…' : 'Open enrollment'}</button>
        </form>
      )}
      <aside className="enrollment-boundary"><strong>Two-key safety design</strong><p>Registration works only when this protected server switch is open and the learner site was deliberately built in enrollment mode. The Phase 22 internet preview is built without Firebase account settings.</p></aside>
    </div>
  )
}
