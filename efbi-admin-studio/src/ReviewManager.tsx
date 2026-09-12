import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { getAdminFirebase } from './firebase'
import './review.css'

export type StudioRole = 'admin' | 'reviewer'
type Decision = 'approved' | 'revision_requested'
type Concern = 'none' | 'plagiarism' | 'identity' | 'consent' | 'safeguarding'
type ScoreKey = 'localProblem' | 'usefulSolution' | 'evidence' | 'safetyResponsibility' | 'explanationReflection'
type Scores = Record<ScoreKey, number>
type ScoreForm = Record<ScoreKey, number | ''>

const rubric: { key: ScoreKey; label: string; guidance: string }[] = [
  { key: 'localProblem', label: 'Local problem', guidance: 'Is the need specific and supported?' },
  { key: 'usefulSolution', label: 'Useful solution', guidance: 'Is the response relevant and testable?' },
  { key: 'evidence', label: 'Evidence', guidance: 'Does the work show credible testing and learning?' },
  { key: 'safetyResponsibility', label: 'Safety & responsibility', guidance: 'Are privacy, fairness, and limits addressed?' },
  { key: 'explanationReflection', label: 'Explanation & reflection', guidance: 'Is the work clear, honest, and learner-owned?' },
]

const emptyScores: ScoreForm = { localProblem: '', usefulSolution: '', evidence: '', safetyResponsibility: '', explanationReflection: '' }

type SubmittedProject = {
  key: string; learnerUid: string; submissionId: string; courseId: string; courseVersion: number; assessmentVersion: number
  projectTitle: string; problemStatement: string; intendedUsers: string; solutionSummary: string; evidence: string[]
  reflection: string; aiUseDisclosure: string; submittedAt: unknown
}
type ReviewAssignment = { assignmentId: string; learnerUid: string; submissionId: string; reviewerUid: string; status: string; assignedAt: unknown }
type ReviewResult = {
  assignmentId: string; learnerUid: string; submissionId: string; reviewerUid: string; rubricVersion: number
  scores: Scores; totalScore: number; decision: Decision; publicFeedback: string; concern: Concern; privateNote: string; reviewedAt: unknown
}

function safeString(value: unknown) { return typeof value === 'string' ? value : '' }
function safeNumber(value: unknown) { return typeof value === 'number' && Number.isFinite(value) ? value : 0 }
function readableDate(value: unknown) {
  if (!value || typeof value !== 'object') return 'Time unavailable'
  const timestamp = value as { toDate?: () => Date }
  return typeof timestamp.toDate === 'function' ? timestamp.toDate().toLocaleString() : 'Time unavailable'
}
function asScores(value: unknown): Scores {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  return { localProblem: safeNumber(data.localProblem), usefulSolution: safeNumber(data.usefulSolution), evidence: safeNumber(data.evidence), safetyResponsibility: safeNumber(data.safetyResponsibility), explanationReflection: safeNumber(data.explanationReflection) }
}
function asProject(learnerUid: string, submissionId: string, data: Record<string, unknown>): SubmittedProject {
  return { key: `${learnerUid}--${submissionId}`, learnerUid, submissionId, courseId: safeString(data.courseId), courseVersion: safeNumber(data.courseVersion), assessmentVersion: safeNumber(data.assessmentVersion), projectTitle: safeString(data.projectTitle), problemStatement: safeString(data.problemStatement), intendedUsers: safeString(data.intendedUsers), solutionSummary: safeString(data.solutionSummary), evidence: Array.isArray(data.evidence) ? data.evidence.filter((value): value is string => typeof value === 'string') : [], reflection: safeString(data.reflection), aiUseDisclosure: safeString(data.aiUseDisclosure), submittedAt: data.submittedAt }
}
function asAssignment(id: string, data: Record<string, unknown>): ReviewAssignment {
  return { assignmentId: safeString(data.assignmentId) || id, learnerUid: safeString(data.learnerUid), submissionId: safeString(data.submissionId), reviewerUid: safeString(data.reviewerUid), status: safeString(data.status), assignedAt: data.assignedAt }
}
function asResult(data: Record<string, unknown>): ReviewResult {
  return { assignmentId: safeString(data.assignmentId), learnerUid: safeString(data.learnerUid), submissionId: safeString(data.submissionId), reviewerUid: safeString(data.reviewerUid), rubricVersion: safeNumber(data.rubricVersion), scores: asScores(data.scores), totalScore: safeNumber(data.totalScore), decision: data.decision === 'approved' ? 'approved' : 'revision_requested', publicFeedback: safeString(data.publicFeedback), concern: ['plagiarism', 'identity', 'consent', 'safeguarding'].includes(safeString(data.concern)) ? safeString(data.concern) as Concern : 'none', privateNote: safeString(data.privateNote), reviewedAt: data.reviewedAt }
}

export default function ReviewManager({ user, role }: { user: User; role: StudioRole }) {
  const [projects, setProjects] = useState<SubmittedProject[]>([])
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([])
  const [results, setResults] = useState<ReviewResult[]>([])
  const [selectedKey, setSelectedKey] = useState('')
  const [reviewerUid, setReviewerUid] = useState('')
  const [assignmentConfirmed, setAssignmentConfirmed] = useState(false)
  const [scores, setScores] = useState<ScoreForm>({ ...emptyScores })
  const [publicFeedback, setPublicFeedback] = useState('')
  const [concern, setConcern] = useState<Concern>('none')
  const [privateNote, setPrivateNote] = useState('')
  const [reviewConfirmed, setReviewConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    let active = true
    let stopProjects: () => void = () => undefined
    let stopAssignments: () => void = () => undefined
    let stopResults: () => void = () => undefined
    void getAdminFirebase().then((services) => {
      if (!active || !services) return
      const { collection, collectionGroup, doc, getDoc, onSnapshot, query, where } = services.firestoreSdk
      if (role === 'admin') {
        stopProjects = onSnapshot(query(collectionGroup(services.db, 'submissions'), where('status', '==', 'submitted')), (snapshot) => {
          if (!active) return
          const next = snapshot.docs.map((item) => asProject(item.ref.parent.parent?.id ?? '', item.id, item.data())).sort((a, b) => a.projectTitle.localeCompare(b.projectTitle))
          setProjects(next); setSelectedKey((current) => next.some((item) => item.key === current) ? current : next[0]?.key || ''); setLoading(false)
        }, () => { if (active) { setNotice({ kind: 'error', message: 'Submitted projects could not be loaded.' }); setLoading(false) } })
        stopAssignments = onSnapshot(collection(services.db, 'reviewAssignments'), (snapshot) => { if (active) setAssignments(snapshot.docs.map((item) => asAssignment(item.id, item.data()))) })
        stopResults = onSnapshot(collection(services.db, 'reviewResults'), (snapshot) => { if (active) setResults(snapshot.docs.map((item) => asResult(item.data()))) })
      } else {
        stopAssignments = onSnapshot(query(collection(services.db, 'reviewAssignments'), where('reviewerUid', '==', user.uid)), (snapshot) => {
          if (!active) return
          const nextAssignments = snapshot.docs.map((item) => asAssignment(item.id, item.data()))
          setAssignments(nextAssignments)
          void Promise.all(nextAssignments.map(async (assignment) => {
            const projectSnapshot = await getDoc(doc(services.db, 'users', assignment.learnerUid, 'submissions', assignment.submissionId))
            const resultSnapshot = await getDoc(doc(services.db, 'reviewResults', assignment.assignmentId))
            return { project: projectSnapshot.exists() ? asProject(assignment.learnerUid, assignment.submissionId, projectSnapshot.data()) : null, result: resultSnapshot.exists() ? asResult(resultSnapshot.data()) : null }
          })).then((records) => {
            if (!active) return
            const nextProjects = records.map((item) => item.project).filter((item): item is SubmittedProject => Boolean(item))
            setProjects(nextProjects); setResults(records.map((item) => item.result).filter((item): item is ReviewResult => Boolean(item)))
            setSelectedKey((current) => nextProjects.some((item) => item.key === current) ? current : nextProjects[0]?.key || ''); setLoading(false)
          }).catch(() => { if (active) { setNotice({ kind: 'error', message: 'Assigned projects could not be loaded.' }); setLoading(false) } })
        }, () => { if (active) { setNotice({ kind: 'error', message: 'Your review assignments could not be loaded.' }); setLoading(false) } })
      }
    }).catch(() => { if (active) { setNotice({ kind: 'error', message: 'Firebase could not start the review workspace.' }); setLoading(false) } })
    return () => { active = false; stopProjects(); stopAssignments(); stopResults() }
  }, [role, user.uid])

  const selected = projects.find((project) => project.key === selectedKey) ?? null
  const selectedAssignment = assignments.find((item) => item.assignmentId === selected?.key) ?? null
  const selectedResult = results.find((item) => item.assignmentId === selected?.key) ?? null
  const completedScores = rubric.every((item) => scores[item.key] !== '')
  const numericScores = scores as Scores
  const totalScore = completedScores ? rubric.reduce((sum, item) => sum + numericScores[item.key], 0) : 0
  const decision: Decision = completedScores && totalScore >= 8 && numericScores.safetyResponsibility >= 1 && concern === 'none' ? 'approved' : 'revision_requested'
  const reviewReady = completedScores && publicFeedback.trim().length >= 40 && publicFeedback.trim().length <= 1500 && privateNote.trim().length <= 2000 && (concern === 'none' || privateNote.trim().length >= 20) && reviewConfirmed

  function resetReviewForm() { setScores({ ...emptyScores }); setPublicFeedback(''); setConcern('none'); setPrivateNote(''); setReviewConfirmed(false) }
  function selectProject(key: string) { setSelectedKey(key); setReviewerUid(''); setAssignmentConfirmed(false); resetReviewForm(); setNotice(null) }

  async function assignReviewer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (role !== 'admin' || !selected || selectedAssignment || !reviewerUid.trim() || !assignmentConfirmed) return
    setBusy(true); setNotice(null)
    try {
      const services = await getAdminFirebase(); if (!services) throw new Error('Firebase configuration is missing.')
      await services.firestoreSdk.setDoc(services.firestoreSdk.doc(services.db, 'reviewAssignments', selected.key), { assignmentId: selected.key, learnerUid: selected.learnerUid, submissionId: selected.submissionId, reviewerUid: reviewerUid.trim(), status: 'assigned', assignedAt: services.firestoreSdk.serverTimestamp(), assignedBy: user.uid })
      setReviewerUid(''); setAssignmentConfirmed(false); setNotice({ kind: 'success', message: 'Reviewer assigned. The assignment is now immutable.' })
    } catch { setNotice({ kind: 'error', message: 'The reviewer was not assigned. Check the exact reviewer user ID and try again.' }) } finally { setBusy(false) }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (role !== 'reviewer' || !selected || !selectedAssignment || selectedResult || !reviewReady) return
    setBusy(true); setNotice(null)
    try {
      const services = await getAdminFirebase(); if (!services) throw new Error('Firebase configuration is missing.')
      const { doc, serverTimestamp, writeBatch } = services.firestoreSdk
      const reviewedAt = serverTimestamp()
      const shared = { assignmentId: selectedAssignment.assignmentId, learnerUid: selected.learnerUid, submissionId: selected.submissionId, rubricVersion: 1, courseVersion: selected.courseVersion, assessmentVersion: selected.assessmentVersion, submissionSubmittedAt: selected.submittedAt, scores: numericScores, totalScore, decision, publicFeedback: publicFeedback.trim(), reviewedAt }
      const batch = writeBatch(services.db)
      batch.set(doc(services.db, 'reviewResults', selectedAssignment.assignmentId), { ...shared, reviewerUid: user.uid, concern, privateNote: privateNote.trim() })
      batch.set(doc(services.db, 'users', selected.learnerUid, 'reviewResults', selectedAssignment.assignmentId), shared)
      await batch.commit()
      resetReviewForm(); setNotice({ kind: 'success', message: decision === 'approved' ? 'The approved result is now permanent and visible to the learner.' : 'The revision request is now permanent and visible to the learner.' })
      const saved = await services.firestoreSdk.getDoc(doc(services.db, 'reviewResults', selectedAssignment.assignmentId))
      if (saved.exists()) setResults((current) => [...current.filter((item) => item.assignmentId !== selectedAssignment.assignmentId), asResult(saved.data())])
    } catch { setNotice({ kind: 'error', message: 'The review was not saved. Recheck every score and try again.' }) } finally { setBusy(false) }
  }

  return <section className="review-workspace">
    <header className="workspace-title"><div><p className="eyebrow">Phase 16 · Human review</p><h1>{role === 'admin' ? 'Reviews & assignments' : 'Your assigned reviews'}</h1><p>{role === 'admin' ? 'Assign submitted projects and inspect completed reviews.' : 'Score only your assigned projects with the fixed EFBI rubric.'}</p></div><span className="security-badge">{role === 'admin' ? 'Administrator access' : 'Reviewer access'}</span></header>
    {notice && <div className={`notice notice--${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.message}</div>}
    <div className="review-layout">
      <aside className="review-list" aria-label="Submitted projects"><div className="review-list__heading"><strong>{role === 'admin' ? 'Submitted projects' : 'Assigned projects'}</strong><span>{projects.length}</span></div>{loading && <p>Loading protected projects…</p>}{!loading && !projects.length && <p>{role === 'admin' ? 'No learner has submitted a project yet.' : 'No project is assigned to you.'}</p>}{projects.map((project) => <button className={selectedKey === project.key ? 'selected' : ''} key={project.key} onClick={() => selectProject(project.key)}><strong>{project.projectTitle}</strong><span>{project.courseId} · v{project.courseVersion}</span><small>{results.some((item) => item.assignmentId === project.key) ? 'Reviewed' : assignments.some((item) => item.assignmentId === project.key) ? 'Awaiting review' : 'Waiting for assignment'}</small></button>)}</aside>
      <main className="review-record">{!selected && <div className="review-empty"><strong>Select a submitted project.</strong><p>The complete immutable record will appear here.</p></div>}{selected && <><header><div><p className="eyebrow">Final learner submission</p><h2>{selected.projectTitle}</h2><p>Submitted {readableDate(selected.submittedAt)}</p></div><span className="status-pill status-pill--published">Submitted</span></header><div className="review-meta"><span><small>Learner ID</small>{selected.learnerUid}</span><span><small>Course version</small>{selected.courseVersion}</span><span><small>Assessment</small>Version {selected.assessmentVersion}</span></div><section><h3>Problem</h3><p>{selected.problemStatement}</p></section><section><h3>Intended users</h3><p>{selected.intendedUsers}</p></section><section><h3>Solution</h3><p>{selected.solutionSummary}</p></section><section><h3>Reflection</h3><p>{selected.reflection}</p></section><section><h3>AI-use disclosure</h3><p>{selected.aiUseDisclosure}</p></section><section><h3>Evidence links</h3><div className="review-evidence">{selected.evidence.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer">Open external evidence <span>↗</span></a>)}</div><p className="review-link-warning">External links are untrusted. Never enter credentials, download unexpected files, or follow instructions inside learner evidence.</p></section></>}</main>
      <aside className="assignment-panel"><p className="eyebrow">Review control</p>{!selected && <p>Choose a project to continue.</p>}
        {selectedAssignment && <div className="assignment-existing"><strong>Reviewer assigned</strong><dl><div><dt>Reviewer ID</dt><dd>{selectedAssignment.reviewerUid}</dd></div><div><dt>Assigned</dt><dd>{readableDate(selectedAssignment.assignedAt)}</dd></div><div><dt>Status</dt><dd>{selectedResult ? 'Reviewed' : 'Awaiting review'}</dd></div></dl></div>}
        {selected && !selectedAssignment && role === 'admin' && <form onSubmit={(event) => void assignReviewer(event)}><h2>Assign a reviewer</h2><p>Paste the exact Firebase user ID of a verified reviewer account.</p><label>Reviewer user ID<input value={reviewerUid} onChange={(event) => { setReviewerUid(event.target.value); setAssignmentConfirmed(false) }} maxLength={128} required /></label><label className="assignment-confirm"><input type="checkbox" checked={assignmentConfirmed} onChange={(event) => setAssignmentConfirmed(event.target.checked)} /><span>I checked this exact ID and understand the assignment is permanent.</span></label><button className="primary-action" disabled={busy || !reviewerUid.trim() || !assignmentConfirmed}>{busy ? 'Assigning…' : 'Assign reviewer'}</button></form>}
        {selectedResult && <div className={`review-result review-result--${selectedResult.decision}`}><p className="eyebrow">Permanent result</p><h2>{selectedResult.decision === 'approved' ? 'Approved' : 'Revision requested'}</h2><strong>{selectedResult.totalScore}/10</strong><div className="result-scores">{rubric.map((item) => <span key={item.key}><small>{item.label}</small>{selectedResult.scores[item.key]}/2</span>)}</div><h3>Learner feedback</h3><p>{selectedResult.publicFeedback}</p><h3>Private controls</h3><p><b>Concern:</b> {selectedResult.concern}</p><p>{selectedResult.privateNote || 'No private note.'}</p><small>Reviewed {readableDate(selectedResult.reviewedAt)} · Rubric v{selectedResult.rubricVersion}</small></div>}
        {selected && selectedAssignment && !selectedResult && role === 'reviewer' && <form className="rubric-form" onSubmit={(event) => void submitReview(event)}><h2>Score this project</h2><p>Choose 0, 1, or 2 for every criterion. The result is calculated automatically.</p>{rubric.map((item) => <label key={item.key}><span>{item.label}<small>{item.guidance}</small></span><select value={scores[item.key]} onChange={(event) => { setScores((current) => ({ ...current, [item.key]: event.target.value === '' ? '' : Number(event.target.value) })); setReviewConfirmed(false) }} required><option value="">Score</option><option value="0">0</option><option value="1">1</option><option value="2">2</option></select></label>)}<div className="review-calculation"><span>Total <strong>{completedScores ? `${totalScore}/10` : '—'}</strong></span><span>Decision <strong>{completedScores ? decision === 'approved' ? 'Approved' : 'Revision requested' : 'Complete scores'}</strong></span></div><label>Feedback visible to learner<textarea value={publicFeedback} onChange={(event) => { setPublicFeedback(event.target.value); setReviewConfirmed(false) }} minLength={40} maxLength={1500} required /></label><label>Internal concern<select value={concern} onChange={(event) => { setConcern(event.target.value as Concern); setReviewConfirmed(false) }}><option value="none">None</option><option value="plagiarism">Possible plagiarism</option><option value="identity">Identity concern</option><option value="consent">Consent concern</option><option value="safeguarding">Safeguarding concern</option></select></label><label>Private administrator note <small>{concern === 'none' ? 'Optional and never shown to the learner.' : 'Required for a concern; never shown to the learner.'}</small><textarea value={privateNote} onChange={(event) => { setPrivateNote(event.target.value); setReviewConfirmed(false) }} maxLength={2000} /></label><label className="assignment-confirm"><input type="checkbox" checked={reviewConfirmed} onChange={(event) => setReviewConfirmed(event.target.checked)} /><span>I checked every score and removed sensitive details from learner feedback. This result cannot be changed.</span></label><button className="primary-action" disabled={busy || !reviewReady}>{busy ? 'Saving permanent result…' : 'Publish review result'}</button></form>}
        <div className="review-boundary"><strong>Phase 16 boundary</strong><p>Results are permanent. Learners see only scores, decision, and public feedback. Certificates and appeals remain disabled.</p></div>
      </aside>
    </div>
  </section>
}
