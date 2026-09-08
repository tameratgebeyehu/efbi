import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from './icons'
import { firebaseAuth, firebaseConfigured, firestore } from './lib/firebase'
import { curriculum } from './data'
import { AuthContext, useAuth, type AuthContextValue } from './auth-context'
import './auth.css'


function requireFirebase() {
  if (!firebaseAuth || !firestore) {
    throw new Error('Student accounts are not connected yet.')
  }
  return { auth: firebaseAuth, db: firestore }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(Boolean(firebaseAuth))

  useEffect(() => {
    if (!firebaseAuth) return undefined
    return onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async signUp(name, email, password) {
      const { auth, db } = requireFirebase()
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
      const displayName = name.trim()
      await updateProfile(credential.user, { displayName })
      await setDoc(doc(db, 'users', credential.user.uid), {
        displayName,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      await sendEmailVerification(credential.user)
    },
    async signIn(email, password) {
      const { auth } = requireFirebase()
      await signInWithEmailAndPassword(auth, email.trim(), password)
    },
    async signOut() {
      const { auth } = requireFirebase()
      await firebaseSignOut(auth)
    },
    async sendPasswordReset(email) {
      const { auth } = requireFirebase()
      await sendPasswordResetEmail(auth, email.trim())
    },
    async resendVerification() {
      const { auth } = requireFirebase()
      if (!auth.currentUser) throw new Error('Sign in before requesting another verification email.')
      await sendEmailVerification(auth.currentUser)
    },
  }), [loading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


function friendlyAuthError(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  if (code.includes('weak-password')) return 'Use a stronger password with at least 10 characters.'
  if (code.includes('network-request-failed')) return 'The connection failed. Check your internet and try again.'
  if (code.includes('too-many-requests')) return 'Too many attempts. Wait a few minutes and try again.'
  if (code.includes('invalid-email')) return 'Enter a valid email address.'
  if (code.includes('invalid-credential') || code.includes('user-not-found') || code.includes('wrong-password')) {
    return 'We could not sign you in with those details.'
  }
  if (code.includes('email-already-in-use')) return 'We could not create this account. Try signing in or resetting your password.'
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

function safeReturnTo(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/account'
}

function SetupMessage() {
  return (
    <div className="account-message account-message--setup">
      <Icon name="shield" />
      <div><strong>Student access is being connected.</strong><p>The secure account foundation is ready. EFBI still needs its development Firebase settings before registration can open.</p></div>
    </div>
  )
}

function AccessFrame({ children }: { children: ReactNode }) {
  return (
    <section className="access-page">
      <div className="access-panel access-panel--form">
        <Link className="brand-alone" to="/"><img src="/efbi-icon.png" alt="" /> EFBI Academy</Link>
        {children}
      </div>
    </section>
  )
}

export function JoinPage() {
  const { user, signUp } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/account" replace />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (name.trim().length < 2) return setError('Enter the name you want shown in your learner account.')
    if (password.length < 10) return setError('Use a password with at least 10 characters.')
    if (password !== confirmPassword) return setError('The passwords do not match.')
    setSubmitting(true)
    try {
      await signUp(name, email, password)
      navigate('/account', { replace: true })
    } catch (cause) {
      setError(friendlyAuthError(cause))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AccessFrame>
      <p className="eyebrow-label">Join EFBI</p>
      <h1>Create your learner account.</h1>
      <p>Save your progress and continue lessons from any device.</p>
      {!firebaseConfigured ? <SetupMessage /> : (
        <form className="account-form" onSubmit={submit}>
          <label>Full name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /></label>
          <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" autoComplete="new-password" minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} required /><small>Use at least 10 characters.</small></label>
          <label>Confirm password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label>
          {error && <p className="form-status form-status--error" role="alert">{error}</p>}
          <button className="button button--primary" disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</button>
        </form>
      )}
      <p className="account-switch">Already have an account? <Link to="/signin">Sign in</Link></p>
    </AccessFrame>
  )
}

export function SignInPage() {
  const { user, signIn, sendPasswordReset } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={safeReturnTo(searchParams.get('returnTo'))} replace />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('')
    setError('')
    setSubmitting(true)
    try {
      await signIn(email, password)
      navigate(safeReturnTo(searchParams.get('returnTo')), { replace: true })
    } catch (cause) {
      setError(friendlyAuthError(cause))
    } finally {
      setSubmitting(false)
    }
  }

  async function resetPassword() {
    setStatus('')
    setError('')
    if (!email.trim()) return setError('Enter your email first, then choose reset password.')
    try {
      await sendPasswordReset(email)
      setStatus('If an EFBI account uses that email, a reset message is on the way.')
    } catch (cause) {
      setError(friendlyAuthError(cause))
    }
  }

  return (
    <AccessFrame>
      <p className="eyebrow-label">Student portal</p>
      <h1>Welcome back.</h1>
      <p>Sign in to continue your course.</p>
      {!firebaseConfigured ? <SetupMessage /> : (
        <form className="account-form" onSubmit={submit}>
          <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <p className="form-status form-status--error" role="alert">{error}</p>}
          {status && <p className="form-status form-status--success" role="status">{status}</p>}
          <button className="button button--primary" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
          <button className="text-button" type="button" onClick={resetPassword}>Reset password</button>
        </form>
      )}
      <p className="account-switch">New to EFBI? <Link to="/join">Create an account</Link></p>
    </AccessFrame>
  )
}

export function AccountPage() {
  const { user, loading, resendVerification, signOut } = useAuth()
  const [status, setStatus] = useState('')

  if (!firebaseConfigured) return <AccessFrame><p className="eyebrow-label">Student account</p><h1>Account setup is almost ready.</h1><SetupMessage /><Link className="button button--outline" to="/courses">Back to courses</Link></AccessFrame>
  if (loading) return <AccessFrame><p className="eyebrow-label">Student account</p><h1>Loading your account…</h1></AccessFrame>
  if (!user) return <Navigate to="/signin" replace />

  const verified = user.emailVerified
  return (
    <AccessFrame>
      <p className="eyebrow-label">Student account</p>
      <h1>{user.displayName ? `Hello, ${user.displayName}.` : 'Hello.'}</h1>
      <p>{user.email}</p>
      <div className={verified ? 'account-message account-message--success' : 'account-message account-message--warning'}>
        <Icon name={verified ? 'check' : 'mail'} />
        <div><strong>{verified ? 'Email verified' : 'Verify your email'}</strong><p>{verified ? 'Your account can open protected lessons.' : 'Use the link EFBI sent before starting a course.'}</p></div>
      </div>
      {status && <p className="form-status form-status--success" role="status">{status}</p>}
      <div className="access-actions">
        {verified ? <Link className="button button--primary" to="/learn/ai-foundations">Open your course</Link> : <button className="button button--primary" onClick={async () => { await resendVerification(); setStatus('A new verification email was sent.') }}>Send verification again</button>}
        <button className="button button--outline" onClick={() => void signOut()}>Sign out</button>
      </div>
    </AccessFrame>
  )
}

export function RequireVerifiedUser({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (!firebaseConfigured) return <Navigate to="/signin" replace />
  if (loading) return <AccessFrame><p className="eyebrow-label">Student access</p><h1>Checking your account…</h1></AccessFrame>
  if (!user) return <Navigate to={`/signin?returnTo=${encodeURIComponent(location.pathname)}`} replace />
  if (!user.emailVerified) return <Navigate to="/account" replace />
  return children
}

export function LearningPage() {
  const { user } = useAuth()
  return (
    <section className="learning-page">
      <div className="shell learning-header"><div><p className="eyebrow-label">AI Foundations for Ethiopia</p><h1>Welcome, {user?.displayName?.split(' ')[0] || 'learner'}.</h1><p>Your secure account is ready. Lesson playback and saved progress are the next build step.</p></div><div className="learning-progress"><strong>0%</strong><span>Course progress</span></div></div>
      <div className="section shell learning-grid">
        <div><h2>Course lessons</h2><ol className="learning-lessons">{curriculum.map((lesson, index) => <li key={lesson.number}><span>{lesson.number}</span><div><h3>{lesson.title}</h3><p>{lesson.detail}</p></div><small>{index === 0 ? 'Next' : 'Locked'}</small></li>)}</ol></div>
        <aside className="learning-note"><Icon name="shield" /><h2>Progress stays private.</h2><p>Only you can read or update your course record. EFBI administrators can review it only when support or certificate approval requires it.</p><Link to="/courses/ai-foundations">View course outline</Link></aside>
      </div>
    </section>
  )
}

export function CourseAccessButton() {
  const { user } = useAuth()
  const destination = user?.emailVerified ? '/learn/ai-foundations' : user ? '/account' : '/signin?returnTo=%2Flearn%2Fai-foundations'
  return <Link className="button button--primary" to={destination}>{user?.emailVerified ? 'Continue course' : 'Start course'}</Link>
}

export function AccountActions({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { user, loading, signOut } = useAuth()
  const className = mobile ? 'mobile-nav-actions' : 'account-actions'
  if (loading) return <div className={className} aria-hidden="true" />
  if (!user) return <div className={className}><Link className="button button--ghost" to="/signin" onClick={onNavigate}>Sign in</Link><Link className="button button--primary button--compact" to="/join" onClick={onNavigate}>Join Academy</Link></div>
  return <div className={className}><Link className="signin-link" to="/account" onClick={onNavigate}>{user.emailVerified ? 'My account' : 'Verify email'}</Link><button className="button button--outline button--compact" type="button" onClick={() => { onNavigate?.(); void signOut() }}>Sign out</button></div>
}
