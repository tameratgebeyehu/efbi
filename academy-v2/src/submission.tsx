import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './auth-context'
import { Icon } from './icons'
import {
  draftErrors,
  emptySubmissionForm,
  finalErrors,
  readSubmission,
  readSubmissionEligibility,
  saveSubmissionDraft,
  submitProject,
  type ProjectSubmission,
  type SubmissionForm,
} from './lib/submission'
import './submission.css'

type LoadState = 'loading' | 'ready' | 'ineligible' | 'error'

function submittedDate(value: unknown) {
  if (!value || typeof value !== 'object') return 'recently'
  const timestamp = value as { toDate?: () => Date }
  if (typeof timestamp.toDate !== 'function') return 'recently'
  return timestamp.toDate().toLocaleString()
}

function formFromSubmission(submission: ProjectSubmission): SubmissionForm {
  return {
    projectTitle: submission.projectTitle,
    problemStatement: submission.problemStatement,
    intendedUsers: submission.intendedUsers,
    solutionSummary: submission.solutionSummary,
    evidence: [...submission.evidence],
    reflection: submission.reflection,
    aiUseDisclosure: submission.aiUseDisclosure,
  }
}

export function SubmissionPage() {
  const { user } = useAuth()
  const [state, setState] = useState<LoadState>('loading')
  const [submission, setSubmission] = useState<ProjectSubmission | null>(null)
  const [form, setForm] = useState<SubmissionForm>({ ...emptySubmissionForm, evidence: ['', '', ''] })
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [consent, setConsent] = useState(false)
  const [finalConfirm, setFinalConfirm] = useState(false)

  useEffect(() => {
    if (!user) return
    let active = true
    void Promise.all([readSubmissionEligibility(user.uid), readSubmission(user.uid)]).then(([eligible, saved]) => {
      if (!active) return
      if (!eligible) {
        setState('ineligible')
        return
      }
      setSubmission(saved)
      if (saved) setForm(formFromSubmission(saved))
      setState('ready')
    }).catch(() => { if (active) setState('error') })
    return () => { active = false }
  }, [user])

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (!dirty || submission?.status === 'submitted') return
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, submission?.status])

  const draftValidation = useMemo(() => draftErrors(form), [form])
  const finalValidation = useMemo(() => finalErrors(form), [form])
  const locked = submission?.status === 'submitted'

  function updateField<Key extends Exclude<keyof SubmissionForm, 'evidence'>>(key: Key, value: SubmissionForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
    setDirty(true)
    setConsent(false)
    setFinalConfirm(false)
    setMessage('')
  }

  function updateEvidence(index: number, value: string) {
    setForm((current) => {
      const evidence = [...current.evidence] as [string, string, string]
      evidence[index] = value
      return { ...current, evidence }
    })
    setDirty(true)
    setConsent(false)
    setFinalConfirm(false)
    setMessage('')
  }

  async function saveDraft(event?: FormEvent) {
    event?.preventDefault()
    if (!user || locked || draftValidation.length) return
    setBusy(true)
    setError('')
    try {
      const saved = await saveSubmissionDraft(user.uid, form, submission)
      setSubmission(saved)
      if (saved) setForm(formFromSubmission(saved))
      setDirty(false)
      setMessage('Draft saved to your EFBI account.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The draft could not be saved. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function submitFinal() {
    if (!user || !submission || locked || finalValidation.length || !consent || !finalConfirm || dirty) return
    setBusy(true)
    setError('')
    try {
      const saved = await submitProject(user.uid, form, submission)
      setSubmission(saved)
      setDirty(false)
      setConsent(false)
      setFinalConfirm(false)
      setMessage('Your project was submitted for assignment to a reviewer.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The project could not be submitted. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (state === 'loading') return <main className="submission-page"><section className="shell submission-state"><div className="submission-spinner" /><h1>Checking your project access…</h1></section></main>
  if (state === 'error') return <main className="submission-page"><section className="shell submission-state"><h1>Your project workspace could not open.</h1><p>Check your connection and try again.</p><button className="button button--primary" onClick={() => window.location.reload()}>Retry</button></section></main>
  if (state === 'ineligible') return <main className="submission-page"><section className="shell submission-state"><Icon name="shield" /><p className="eyebrow-label">Project locked</p><h1>Finish all four lessons first.</h1><p>Your course progress must reach 100% before EFBI accepts a project draft.</p><Link className="button button--primary" to="/learn/ai-foundations">Continue learning</Link></section></main>

  if (locked && submission) {
    return <main className="submission-page"><section className="shell"><header className="submission-hero"><div><p className="eyebrow-label">Project submitted</p><h1>{submission.projectTitle}</h1><p>Submitted {submittedDate(submission.submittedAt)}. Your work is locked while EFBI assigns a reviewer.</p></div><span className="submission-status submission-status--submitted">Submitted</span></header><div className="submitted-project"><section><h2>Your project record</h2><dl><div><dt>Problem</dt><dd>{submission.problemStatement}</dd></div><div><dt>Intended users</dt><dd>{submission.intendedUsers}</dd></div><div><dt>Solution</dt><dd>{submission.solutionSummary}</dd></div><div><dt>Reflection</dt><dd>{submission.reflection}</dd></div><div><dt>AI use</dt><dd>{submission.aiUseDisclosure}</dd></div></dl></section><aside><h2>Evidence links</h2>{submission.evidence.filter(Boolean).map((link) => <a key={link} href={link} target="_blank" rel="noreferrer">Open evidence <span>↗</span></a>)}<div className="submission-lock-note"><Icon name="shield" /><p><strong>Immutable submission</strong><span>Neither you nor a reviewer can silently change this submitted record.</span></p></div></aside></div>{message && <p className="form-status form-status--success">{message}</p>}<Link className="button button--outline" to="/account">Back to account</Link></section></main>
  }

  return (
    <main className="submission-page">
      <section className="shell">
        <header className="submission-hero"><div><p className="eyebrow-label">AI Foundations · Final project</p><h1>Show what you built.</h1><p>Save a private draft, add evidence, and submit only when the work is ready for a person to review.</p></div><span className="submission-status">{submission ? 'Draft saved' : 'New draft'}</span></header>
        <div className="submission-layout">
          <form className="submission-form" onSubmit={(event) => void saveDraft(event)}>
            <section><div className="submission-section-heading"><span>01</span><div><h2>The need</h2><p>Describe one specific problem and the people affected.</p></div></div><label>Project title <small>{form.projectTitle.length}/100</small><input value={form.projectTitle} onChange={(event) => updateField('projectTitle', event.target.value)} maxLength={100} placeholder="A clear name for your project" /></label><label>What problem did you choose? <small>{form.problemStatement.length}/1200</small><textarea value={form.problemStatement} onChange={(event) => updateField('problemStatement', event.target.value)} maxLength={1200} placeholder="Explain what is happening, where, and why it matters." /></label><label>Who is this for? <small>{form.intendedUsers.length}/600</small><textarea className="submission-textarea--short" value={form.intendedUsers} onChange={(event) => updateField('intendedUsers', event.target.value)} maxLength={600} placeholder="Describe the students, teachers, families, or community members." /></label></section>
            <section><div className="submission-section-heading"><span>02</span><div><h2>Your solution</h2><p>Explain what you made, tested, or planned.</p></div></div><label>Solution summary <small>{form.solutionSummary.length}/2000</small><textarea value={form.solutionSummary} onChange={(event) => updateField('solutionSummary', event.target.value)} maxLength={2000} placeholder="What does it do? How would someone use it? What are its limits?" /></label><div className="evidence-fields"><div><h3>Evidence links</h3><p>Add up to three public HTTPS links. Do not include passwords or private documents.</p></div>{form.evidence.map((link, index) => <label key={index}>Evidence link {index + 1}{index > 0 && <small>Optional</small>}<input type="url" inputMode="url" value={link} onChange={(event) => updateEvidence(index, event.target.value)} maxLength={500} placeholder="https://…" /></label>)}</div></section>
            <section><div className="submission-section-heading"><span>03</span><div><h2>What you learned</h2><p>Use your own words and be honest about help you received.</p></div></div><label>Reflection <small>{form.reflection.length}/2000</small><textarea value={form.reflection} onChange={(event) => updateField('reflection', event.target.value)} maxLength={2000} placeholder="What worked, what did not, and what would you improve?" /></label><label>How did you use AI? <small>{form.aiUseDisclosure.length}/1200</small><textarea className="submission-textarea--short" value={form.aiUseDisclosure} onChange={(event) => updateField('aiUseDisclosure', event.target.value)} maxLength={1200} placeholder="Explain what AI helped with, what you checked, or say clearly that you did not use AI." /></label></section>
            {draftValidation.length > 0 && <div className="submission-errors"><strong>Before saving</strong><ul>{draftValidation.map((item) => <li key={item}>{item}</li>)}</ul></div>}
            {error && <p className="form-status form-status--error" role="alert">{error}</p>}
            {message && <p className="form-status form-status--success" role="status">{message}</p>}
            <div className="submission-save"><div><strong>{dirty ? 'Unsaved changes' : submission ? 'Draft saved' : 'Not saved yet'}</strong><span>Save before leaving this page or turning off the device.</span></div><button className="button button--primary" disabled={busy || draftValidation.length > 0 || (!dirty && Boolean(submission))}>{busy ? 'Saving…' : 'Save private draft'}</button></div>
          </form>
          <aside className="submission-sidebar">
            <div><p className="eyebrow-label">Final check</p><h2>Submit for human review</h2><p>First save the exact draft you want reviewed. Submission becomes permanent.</p></div>
            {finalValidation.length > 0 ? <div className="final-check-list"><strong>Still needed</strong><ul>{finalValidation.map((item) => <li key={item}>{item}</li>)}</ul></div> : <div className="final-ready"><Icon name="check" /><strong>Your saved content can be submitted.</strong></div>}
            <label className="submission-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span><strong>I agree to the EFBI project consent.</strong>I created this work or have permission to share it. I removed unnecessary personal information. An assigned EFBI reviewer may access it, and I honestly explained my AI use.</span></label>
            <label className="submission-consent"><input type="checkbox" checked={finalConfirm} onChange={(event) => setFinalConfirm(event.target.checked)} /><span><strong>I understand this submission will be locked.</strong>I reviewed the saved draft and want to send this exact version for review.</span></label>
            {dirty && <p className="submission-warning">Save your latest changes before submitting.</p>}
            {!submission && <p className="submission-warning">Save the first draft before submitting.</p>}
            <button className="button button--primary" type="button" disabled={busy || !submission || dirty || finalValidation.length > 0 || !consent || !finalConfirm} onClick={() => void submitFinal()}>{busy ? 'Submitting…' : 'Submit project for review'}</button>
            <div className="submission-privacy"><Icon name="shield" /><p><strong>Private by default</strong><span>Only you, EFBI administrators, and your specifically assigned reviewer can access a submitted project.</span></p></div>
            <p className="submission-pilot-note">Pilot rule: evidence links only. File uploads and certificate decisions are not active.</p>
          </aside>
        </div>
      </section>
    </main>
  )
}
