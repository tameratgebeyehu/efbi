import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { firebaseConfigured, getAdminFirebase } from './firebase'

type AccessState = 'loading' | 'signed-out' | 'denied' | 'admin' | 'error'

const localHost = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'

function SignIn({ onError }: { onError: (message: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    onError('')
    try {
      const services = await getAdminFirebase()
      if (!services) throw new Error('Firebase configuration is missing.')
      await services.authSdk.signInWithEmailAndPassword(services.auth, email.trim(), password)
      setPassword('')
    } catch {
      onError('Sign-in failed. Check the account and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="access-shell">
      <section className="access-card">
        <div className="brand"><img src="/efbi-icon.png" alt="" /><span>EFBI</span><small>ADMIN STUDIO</small></div>
        <p className="eyebrow">Local administration</p>
        <h1>Sign in to the private studio.</h1>
        <p className="lede">Only a verified account with the Firebase admin claim can continue.</p>
        <form onSubmit={submit}>
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" minLength={10} required /></label>
          <button type="submit" disabled={submitting}>{submitting ? 'Checking access…' : 'Sign in securely'}</button>
        </form>
        <div className="local-note"><strong>Session-only access</strong><span>The browser session ends when this window is closed.</span></div>
      </section>
    </main>
  )
}

function Dashboard({ user, signOut }: { user: User; signOut: () => Promise<void> }) {
  const areas = [
    { number: '01', title: 'Courses', detail: 'Draft and publishing tools arrive in Phase 10.', status: 'Foundation ready' },
    { number: '02', title: 'Lessons & questions', detail: 'Structured lesson and practice editors arrive in Phase 11.', status: 'Locked' },
    { number: '03', title: 'Submissions', detail: 'Text and evidence-link review arrives after course migration.', status: 'Locked' },
    { number: '04', title: 'Certificates', detail: 'Issuance stays disabled until reviewed assessment is proven.', status: 'Locked' },
  ]

  return (
    <div className="studio">
      <aside className="sidebar">
        <div className="brand brand--light"><img src="/efbi-icon.png" alt="" /><span>EFBI</span><small>ADMIN STUDIO</small></div>
        <nav aria-label="Admin sections"><button className="active">Overview</button><button disabled>Courses</button><button disabled>Reviews</button><button disabled>Certificates</button><button disabled>Audit log</button></nav>
        <div className="operator"><small>Verified operator</small><strong>{user.email}</strong><button onClick={() => void signOut()}>Sign out</button></div>
      </aside>
      <main className="workspace">
        <header><div><p className="eyebrow">Phase 9 foundation</p><h1>Good morning, builder.</h1><p>The studio is local, the identity is verified, and content writes remain locked.</p></div><span className="security-badge">Admin claim verified</span></header>
        <section className="safety-grid" aria-label="Security status">
          <article><small>Network</small><strong>Localhost only</strong><p>Not published with the student website.</p></article>
          <article><small>Session</small><strong>Browser session</strong><p>No shared admin password or permanent browser role.</p></article>
          <article><small>Backend</small><strong>Writes locked</strong><p>Phase 10 must add schema validation and rule tests first.</p></article>
        </section>
        <section className="area-section"><div className="section-heading"><div><p className="eyebrow">Control areas</p><h2>Built in secure stages</h2></div><p>Unavailable actions are visibly locked instead of pretending to work.</p></div><div className="area-grid">{areas.map((area) => <article key={area.number}><span>{area.number}</span><div><h3>{area.title}</h3><p>{area.detail}</p></div><small>{area.status}</small></article>)}</div></section>
        <section className="next-step"><div><p className="eyebrow">Next checkpoint</p><h2>Course drafts and immutable releases</h2><p>Phase 10 will add validated course creation, preview, and publishing without exposing an admin route publicly.</p></div><button disabled>Course editor locked</button></section>
      </main>
    </div>
  )
}

export default function App() {
  const [access, setAccess] = useState<AccessState>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!localHost || !firebaseConfigured) {
      setAccess('error')
      return
    }
    let active = true
    let unsubscribe: () => void = () => undefined
    void getAdminFirebase().then((services) => {
      if (!active || !services) {
        if (active) setAccess('error')
        return
      }
      unsubscribe = services.authSdk.onIdTokenChanged(services.auth, (currentUser) => {
        void (async () => {
          if (!active) return
          setUser(currentUser)
          if (!currentUser) {
            setAccess('signed-out')
            return
          }
          try {
            const token = await services.authSdk.getIdTokenResult(currentUser, true)
            const allowed = currentUser.emailVerified && token.claims.admin === true
            setAccess(allowed ? 'admin' : 'denied')
          } catch {
            setAccess('error')
          }
        })()
      })
    }).catch(() => { if (active) setAccess('error') })
    return () => { active = false; unsubscribe() }
  }, [])

  async function signOut() {
    const services = await getAdminFirebase()
    if (services) await services.authSdk.signOut(services.auth)
  }

  if (!localHost) return <main className="blocked"><h1>Admin Studio blocked.</h1><p>This application runs only on localhost and must never be hosted publicly.</p></main>
  if (!firebaseConfigured) return <main className="blocked"><h1>Firebase configuration is missing.</h1><p>The studio reads the ignored development settings from the student project.</p></main>
  if (access === 'loading') return <main className="blocked"><div className="spinner" /><h1>Checking the local session…</h1></main>
  if (access === 'signed-out') return <><SignIn onError={setMessage} />{message && <p className="toast" role="alert">{message}</p>}</>
  if (access === 'denied') return <main className="blocked"><h1>Access denied.</h1><p>{user?.emailVerified ? 'This verified account does not have the admin claim.' : 'Verify this account’s email before requesting admin access.'}</p><button onClick={() => void signOut()}>Sign out</button></main>
  if (access === 'error' || !user) return <main className="blocked"><h1>The studio could not verify access.</h1><p>Close it, check the local Firebase settings, and try again.</p><button onClick={() => window.location.reload()}>Retry</button></main>
  return <Dashboard user={user} signOut={signOut} />
}
