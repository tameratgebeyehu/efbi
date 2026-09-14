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
import EnrollmentManager from './EnrollmentManager'
import CourseActivationManager from './CourseActivationManager'
import ProgramManager from './ProgramManager'
import BlogManager from './BlogManager'
import SafetyReadiness from './SafetyReadiness'
import LaunchReadiness from './LaunchReadiness'
import LaunchContentPack from './LaunchContentPack'

type AccessState = 'loading' | 'signed-out' | 'denied' | 'admin' | 'reviewer' | 'error'
type StudioSection = 'overview' | 'launch' | 'launch-drafts' | 'enrollment' | 'safety' | 'programs' | 'blog' | 'courses' | 'lessons' | 'activation' | 'reviews' | 'certificates' | 'audit' | 'retention'
type NavigationItem = { id: StudioSection; label: string }

const ownerNavigation: NavigationItem[] = [
  { id: 'overview', label: 'Home' },
  { id: 'programs', label: 'Programs' },
  { id: 'courses', label: 'Courses' },
  { id: 'lessons', label: 'Lessons & videos' },
  { id: 'activation', label: 'Publish course' },
  { id: 'blog', label: 'Blog' },
  { id: 'reviews', label: 'Learner reviews' },
  { id: 'certificates', label: 'Certificates' },
]

const advancedNavigation: NavigationItem[] = [
  { id: 'launch', label: 'Launch checks' },
  { id: 'launch-drafts', label: 'Starter content' },
  { id: 'enrollment', label: 'Enrollment settings' },
  { id: 'safety', label: 'Safety & incidents' },
  { id: 'audit', label: 'Activity history' },
  { id: 'retention', label: 'Privacy & deletion' },
]

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
  const [section, setSection] = useState<StudioSection>(role === 'reviewer' ? 'reviews' : 'overview')
  const [navigationOpen, setNavigationOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const navigation = role === 'admin' ? [...ownerNavigation, ...advancedNavigation] : ownerNavigation.filter((item) => item.id === 'reviews')
  const currentSectionLabel = navigation.find((item) => item.id === section)?.label ?? 'Studio sections'
  const advancedActive = advancedNavigation.some((item) => item.id === section)

  useEffect(() => {
    if (!navigationOpen) return undefined
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setNavigationOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [navigationOpen])

  function openSection(nextSection: StudioSection) {
    setSection(nextSection)
    setNavigationOpen(false)
  }
  const areas = [
    { section: 'programs' as const, number: '01', title: 'Programs', detail: 'Edit the learning areas shown on the website.' },
    { section: 'courses' as const, number: '02', title: 'Courses', detail: 'Create or update a course.' },
    { section: 'lessons' as const, number: '03', title: 'Lessons & videos', detail: 'Add lesson text, a YouTube link, and practice questions.' },
    { section: 'activation' as const, number: '04', title: 'Publish course', detail: 'Put the approved course and lessons online together.' },
    { section: 'blog' as const, number: '05', title: 'Blog', detail: 'Write and publish an EFBI article.' },
    { section: 'reviews' as const, number: '06', title: 'Learner reviews', detail: 'Review submitted student projects.' },
    { section: 'certificates' as const, number: '07', title: 'Certificates', detail: 'Manage certificate requests and issued certificates.' },
  ]

  return (
    <div className="studio">
      <aside className="sidebar">
        <div className="brand brand--light"><img src="/efbi-icon.png" alt="" /><span>EFBI</span><small>ADMIN STUDIO</small></div>
        <button className="studio-menu-toggle" type="button" aria-expanded={navigationOpen} aria-controls="studio-navigation" onClick={() => setNavigationOpen((current) => !current)}><span>{navigationOpen ? 'Close menu' : 'Open menu'}</span><small>{currentSectionLabel}</small></button>
        <nav id="studio-navigation" className={navigationOpen ? 'is-open' : ''} aria-label="Studio sections">
          {(role === 'admin' ? ownerNavigation : navigation).map((item) => <button data-studio-section key={item.id} className={section === item.id ? 'active' : ''} aria-current={section === item.id ? 'page' : undefined} onClick={() => openSection(item.id)}>{item.label}</button>)}
          {role === 'admin' && <div className={`advanced-navigation ${advancedOpen ? 'is-open' : ''}`}><button className={advancedActive ? 'advanced-navigation-toggle active' : 'advanced-navigation-toggle'} type="button" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen((current) => !current)}><span>Advanced tools</span><small>{advancedOpen ? 'Hide' : 'Show'}</small></button><div>{advancedNavigation.map((item) => <button data-studio-section key={item.id} className={section === item.id ? 'active' : ''} aria-current={section === item.id ? 'page' : undefined} onClick={() => openSection(item.id)}>{item.label}</button>)}</div></div>}
        </nav>
        <div className="operator"><small>{role === 'admin' ? 'Verified administrator' : 'Verified reviewer'}</small><strong>{user.email}</strong><button onClick={() => void signOut()}>Sign out</button></div>
      </aside>
      <main className="workspace">
        {section === 'launch' && role === 'admin' ? <LaunchReadiness /> : section === 'launch-drafts' && role === 'admin' ? <LaunchContentPack user={user} /> : section === 'enrollment' && role === 'admin' ? <EnrollmentManager user={user} /> : section === 'safety' && role === 'admin' ? <SafetyReadiness /> : section === 'programs' && role === 'admin' ? <ProgramManager user={user} /> : section === 'blog' && role === 'admin' ? <BlogManager user={user} /> : section === 'courses' && role === 'admin' ? <CourseManager user={user} /> : section === 'lessons' && role === 'admin' ? <LessonManager user={user} /> : section === 'activation' && role === 'admin' ? <CourseActivationManager user={user} /> : section === 'reviews' ? <ReviewManager user={user} role={role} /> : section === 'certificates' && role === 'admin' ? <CertificateManager user={user} /> : section === 'audit' && role === 'admin' ? <AuditLog /> : section === 'retention' && role === 'admin' ? <RetentionManager user={user} /> : <>
        <header><div><p className="eyebrow">EFBI Admin Studio</p><h1>What would you like to do?</h1><p>Choose a task below. Your drafts save safely, and nothing becomes public until you approve it.</p></div><span className="security-badge">Signed in</span></header>
        <section className="safety-grid" aria-label="Security status">
          <article><small>Studio</small><strong>Private on this computer</strong><p>The admin area is not part of the public website.</p></article>
          <article><small>Enrollment</small><strong>Currently closed</strong><p>Visitors cannot create learner accounts yet.</p></article>
          <article><small>Saving</small><strong>Recovery enabled</strong><p>Unsaved editor text can return after a reload or power loss.</p></article>
        </section>
        <section className="area-section"><div className="section-heading"><div><p className="eyebrow">Main tasks</p><h2>Build and manage EFBI</h2></div><p>Start with a program, create its course, add lessons and videos, then publish.</p></div><div className="area-grid">{areas.map((area) => <button className="dashboard-action" type="button" key={area.number} onClick={() => openSection(area.section)}><span>{area.number}</span><div><h3>{area.title}</h3><p>{area.detail}</p></div><small>Open</small></button>)}</div></section>
        <section className="next-step"><div><p className="eyebrow">Simple publishing order</p><h2>Program → Course → Lessons → Publish</h2><p>Add the YouTube link inside Lessons & videos. Preview your work, save it, and use Publish course only when the course and its lessons are ready.</p></div><button type="button" onClick={() => openSection('lessons')}>Add lesson or video</button></section>
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
