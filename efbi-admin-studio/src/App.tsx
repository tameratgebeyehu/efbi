import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { firebaseConfigured, getAdminFirebase } from './firebase'
import CertificateManager from './CertificateManager'
import CourseManager from './CourseManager'
import LessonManager from './LessonManager'
import AuditLog from './AuditLog'
import ReviewManager, { type StudioRole } from './ReviewManager'
import RetentionManager from './RetentionManager'

type AccessState = 'loading' | 'signed-out' | 'denied' | 'admin' | 'reviewer' | 'error'

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
        <p className="lede">Only a verified account with EFBI administrator or reviewer permission can continue.</p>
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

function Dashboard({ user, role, signOut }: { user: User; role: StudioRole; signOut: () => Promise<void> }) {
  const [section, setSection] = useState<'overview' | 'courses' | 'lessons' | 'reviews' | 'certificates' | 'audit' | 'retention'>(role === 'reviewer' ? 'reviews' : 'overview')
  const areas = [
    { number: '01', title: 'Courses', detail: 'Create, review, preview, and publish versioned course records.', status: 'Available' },
    { number: '02', title: 'Lessons & questions', detail: 'Draft lessons and browser-only practice checks with audited saves.', status: 'Available' },
    { number: '03', title: 'Reviews & assignments', detail: 'Assign immutable submissions and give reviewers narrow read access.', status: 'Available' },
    { number: '04', title: 'Certificates', detail: 'Issue, revoke, or replace a credential through atomic audited actions.', status: 'Available' },
    { number: '05', title: 'Audit history', detail: 'Read the immutable history of course and lesson operations.', status: 'Available' },
    { number: '06', title: 'Privacy & retention', detail: 'Process deletion requests with documented holds and protected credential evidence.', status: 'Available' },
  ]

  return (
    <div className="studio">
      <aside className="sidebar">
        <div className="brand brand--light"><img src="/efbi-icon.png" alt="" /><span>EFBI</span><small>ADMIN STUDIO</small></div>
        <nav aria-label="Studio sections">
          {role === 'admin' && <button className={section === 'overview' ? 'active' : ''} onClick={() => setSection('overview')}>Overview</button>}
          {role === 'admin' && <button className={section === 'courses' ? 'active' : ''} onClick={() => setSection('courses')}>Courses</button>}
          {role === 'admin' && <button className={section === 'lessons' ? 'active' : ''} onClick={() => setSection('lessons')}>Lessons</button>}
          <button className={section === 'reviews' ? 'active' : ''} onClick={() => setSection('reviews')}>Reviews</button>
          {role === 'admin' && <button className={section === 'certificates' ? 'active' : ''} onClick={() => setSection('certificates')}>Certificates</button>}
          {role === 'admin' && <button className={section === 'audit' ? 'active' : ''} onClick={() => setSection('audit')}>Audit history</button>}
          {role === 'admin' && <button className={section === 'retention' ? 'active' : ''} onClick={() => setSection('retention')}>Privacy & retention</button>}
        </nav>
        <div className="operator"><small>{role === 'admin' ? 'Verified administrator' : 'Verified reviewer'}</small><strong>{user.email}</strong><button onClick={() => void signOut()}>Sign out</button></div>
      </aside>
      <main className="workspace">
        {section === 'courses' && role === 'admin' ? <CourseManager user={user} /> : section === 'lessons' && role === 'admin' ? <LessonManager user={user} /> : section === 'reviews' ? <ReviewManager user={user} role={role} /> : section === 'certificates' && role === 'admin' ? <CertificateManager user={user} /> : section === 'audit' && role === 'admin' ? <AuditLog /> : section === 'retention' && role === 'admin' ? <RetentionManager user={user} /> : <>
        <header><div><p className="eyebrow">Phase 20 workspace</p><h1>Good morning, builder.</h1><p>Course, review, certificate, and learner privacy operations are available through protected steps.</p></div><span className="security-badge">Admin claim verified</span></header>
        <section className="safety-grid" aria-label="Security status">
          <article><small>Network</small><strong>Localhost only</strong><p>Not published with the student website.</p></article>
          <article><small>Session</small><strong>Browser session</strong><p>No shared admin password or permanent browser role.</p></article>
          <article><small>Privacy</small><strong>Controlled deletion</strong><p>Learner requests are restricted, reviewed, and permanently recorded.</p></article>
        </section>
        <section className="area-section"><div className="section-heading"><div><p className="eyebrow">Control areas</p><h2>Built in secure stages</h2></div><p>Only tested workflows are enabled. Later operations remain visibly locked.</p></div><div className="area-grid">{areas.map((area) => <article key={area.number}><span>{area.number}</span><div><h3>{area.title}</h3><p>{area.detail}</p></div><small>{area.status}</small></article>)}</div></section>
        <section className="next-step"><div><p className="eyebrow">Current checkpoint</p><h2>Privacy requests now have an operations queue</h2><p>Internal targets, hold reviews, and Authentication cleanup are visible without weakening certificate evidence.</p></div><span className="next-step__badge">Phase 20 active</span></section>
        </>}
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
            const role = token.claims.admin === true ? 'admin' : token.claims.reviewer === true ? 'reviewer' : null
            setAccess(currentUser.emailVerified && role ? role : 'denied')
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
  if (access === 'denied') return <main className="blocked"><h1>Access denied.</h1><p>{user?.emailVerified ? 'This verified account does not have an EFBI operator role.' : 'Verify this account’s email before requesting admin access.'}</p><button onClick={() => void signOut()}>Sign out</button></main>
  if (access === 'error' || !user) return <main className="blocked"><h1>The studio could not verify access.</h1><p>Close it, check the local Firebase settings, and try again.</p><button onClick={() => window.location.reload()}>Retry</button></main>
  return <Dashboard user={user} role={access === 'reviewer' ? 'reviewer' : 'admin'} signOut={signOut} />
}
