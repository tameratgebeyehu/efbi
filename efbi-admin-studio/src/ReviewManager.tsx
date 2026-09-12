import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { getAdminFirebase } from './firebase'
import './review.css'

export type StudioRole = 'admin' | 'reviewer'

type SubmittedProject = {
  key: string
  learnerUid: string
  submissionId: string
  courseId: string
  courseVersion: number
  assessmentVersion: number
  projectTitle: string
  problemStatement: string
  intendedUsers: string
  solutionSummary: string
  evidence: string[]
  reflection: string
  aiUseDisclosure: string
  submittedAt: unknown
}

type ReviewAssignment = {
  assignmentId: string
  learnerUid: string
  submissionId: string
  reviewerUid: string
  status: string
  assignedAt: unknown
}

function safeString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function safeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function readableDate(value: unknown) {
  if (!value || typeof value !== 'object') return 'Time unavailable'
  const timestamp = value as { toDate?: () => Date }
  return typeof timestamp.toDate === 'function' ? timestamp.toDate().toLocaleString() : 'Time unavailable'
}

function asProject(learnerUid: string, submissionId: string, data: Record<string, unknown>): SubmittedProject {
  return {
    key: `${learnerUid}--${submissionId}`,
    learnerUid,
    submissionId,
    courseId: safeString(data.courseId),
    courseVersion: safeNumber(data.courseVersion),
    assessmentVersion: safeNumber(data.assessmentVersion),
    projectTitle: safeString(data.projectTitle),
    problemStatement: safeString(data.problemStatement),
    intendedUsers: safeString(data.intendedUsers),
    solutionSummary: safeString(data.solutionSummary),
    evidence: Array.isArray(data.evidence) ? data.evidence.filter((value): value is string => typeof value === 'string') : [],
    reflection: safeString(data.reflection),
    aiUseDisclosure: safeString(data.aiUseDisclosure),
    submittedAt: data.submittedAt,
  }
}

function asAssignment(id: string, data: Record<string, unknown>): ReviewAssignment {
  return {
    assignmentId: safeString(data.assignmentId) || id,
    learnerUid: safeString(data.learnerUid),
    submissionId: safeString(data.submissionId),
    reviewerUid: safeString(data.reviewerUid),
    status: safeString(data.status),
    assignedAt: data.assignedAt,
  }
}

export default function ReviewManager({ user, role }: { user: User; role: StudioRole }) {
  const [projects, setProjects] = useState<SubmittedProject[]>([])
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([])
  const [selectedKey, setSelectedKey] = useState('')
  const [reviewerUid, setReviewerUid] = useState('')
  const [assignmentConfirmed, setAssignmentConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    let active = true
    let stopProjects: () => void = () => undefined
    let stopAssignments: () => void = () => undefined
    void getAdminFirebase().then((services) => {
      if (!active || !services) return
      const { collection, collectionGroup, doc, getDoc, onSnapshot, query, where } = services.firestoreSdk
      if (role === 'admin') {
        const projectQuery = query(collectionGroup(services.db, 'submissions'), where('status', '==', 'submitted'))
        stopProjects = onSnapshot(projectQuery, (snapshot) => {
          if (!active) return
          const next = snapshot.docs.map((item) => {
            const learnerUid = item.ref.parent.parent?.id ?? ''
            return asProject(learnerUid, item.id, item.data())
          }).sort((left, right) => left.projectTitle.localeCompare(right.projectTitle))
          setProjects(next)
          setSelectedKey((current) => current || next[0]?.key || '')
          setLoading(false)
        }, () => { if (active) { setNotice({ kind: 'error', message: 'Submitted projects could not be loaded.' }); setLoading(false) } })
        stopAssignments = onSnapshot(collection(services.db, 'reviewAssignments'), (snapshot) => {
          if (active) setAssignments(snapshot.docs.map((item) => asAssignment(item.id, item.data())))
        }, () => { if (active) setNotice({ kind: 'error', message: 'Review assignments could not be loaded.' }) })
      } else {
        const assignmentQuery = query(collection(services.db, 'reviewAssignments'), where('reviewerUid', '==', user.uid))
        stopAssignments = onSnapshot(assignmentQuery, (snapshot) => {
          if (!active) return
          const nextAssignments = snapshot.docs.map((item) => asAssignment(item.id, item.data()))
          setAssignments(nextAssignments)
          void Promise.all(nextAssignments.map(async (assignment) => {
            const reference = doc(services.db, 'users', assignment.learnerUid, 'submissions', assignment.submissionId)
            const project = await getDoc(reference)
            return project.exists() ? asProject(assignment.learnerUid, assignment.submissionId, project.data()) : null
          })).then((records) => {
            if (!active) return
            const next = records.filter((record): record is SubmittedProject => Boolean(record))
            setProjects(next)
            setSelectedKey((current) => current || next[0]?.key || '')
            setLoading(false)
          }).catch(() => { if (active) { setNotice({ kind: 'error', message: 'Assigned projects could not be loaded.' }); setLoading(false) } })
        }, () => { if (active) { setNotice({ kind: 'error', message: 'Your review assignments could not be loaded.' }); setLoading(false) } })
      }
    }).catch(() => { if (active) { setNotice({ kind: 'error', message: 'Firebase could not start the review workspace.' }); setLoading(false) } })
    return () => { active = false; stopProjects(); stopAssignments() }
  }, [role, user.uid])

  const selected = projects.find((project) => project.key === selectedKey) ?? null
  const selectedAssignment = useMemo(() => assignments.find((assignment) => assignment.learnerUid === selected?.learnerUid && assignment.submissionId === selected?.submissionId) ?? null, [assignments, selected])

  async function assignReviewer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (role !== 'admin' || !selected || selectedAssignment || !reviewerUid.trim() || !assignmentConfirmed) return
    setBusy(true)
    setNotice(null)
    try {
      const services = await getAdminFirebase()
      if (!services) throw new Error('Firebase configuration is missing.')
      const { doc, serverTimestamp, setDoc } = services.firestoreSdk
      const assignmentId = `${selected.learnerUid}--${selected.submissionId}`
      await setDoc(doc(services.db, 'reviewAssignments', assignmentId), {
        assignmentId,
        learnerUid: selected.learnerUid,
        submissionId: selected.submissionId,
        reviewerUid: reviewerUid.trim(),
        status: 'assigned',
        assignedAt: serverTimestamp(),
        assignedBy: user.uid,
      })
      setReviewerUid('')
      setAssignmentConfirmed(false)
      setNotice({ kind: 'success', message: 'Reviewer assigned. The assignment is now immutable.' })
    } catch {
      setNotice({ kind: 'error', message: 'The reviewer was not assigned. Check the exact reviewer user ID and try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="review-workspace">
      <header className="workspace-title"><div><p className="eyebrow">Phase 15 · Submitted projects</p><h1>{role === 'admin' ? 'Review assignments' : 'Your assigned reviews'}</h1><p>{role === 'admin' ? 'See final learner submissions and assign each one to a verified reviewer.' : 'Read only the submitted projects specifically assigned to your reviewer account.'}</p></div><span className="security-badge">{role === 'admin' ? 'Administrator access' : 'Reviewer access'}</span></header>
      {notice && <div className={`notice notice--${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.message}</div>}
      <div className="review-layout">
        <aside className="review-list" aria-label="Submitted projects"><div className="review-list__heading"><strong>{role === 'admin' ? 'Submitted projects' : 'Assigned projects'}</strong><span>{projects.length}</span></div>{loading && <p>Loading protected projects…</p>}{!loading && projects.length === 0 && <p>{role === 'admin' ? 'No learner has submitted a project yet.' : 'No project is assigned to you.'}</p>}{projects.map((project) => <button className={selectedKey === project.key ? 'selected' : ''} key={project.key} onClick={() => { setSelectedKey(project.key); setReviewerUid(''); setAssignmentConfirmed(false); setNotice(null) }}><strong>{project.projectTitle}</strong><span>{project.courseId} · v{project.courseVersion}</span><small>{assignments.some((assignment) => assignment.assignmentId === project.key) ? 'Assigned' : 'Waiting for assignment'}</small></button>)}</aside>
        <main className="review-record">
          {!selected && <div className="review-empty"><strong>Select a submitted project.</strong><p>The complete immutable record will appear here.</p></div>}
          {selected && <><header><div><p className="eyebrow">Final learner submission</p><h2>{selected.projectTitle}</h2><p>Submitted {readableDate(selected.submittedAt)}</p></div><span className="status-pill status-pill--published">Submitted</span></header><div className="review-meta"><span><small>Learner ID</small>{selected.learnerUid}</span><span><small>Course version</small>{selected.courseVersion}</span><span><small>Assessment</small>Version {selected.assessmentVersion}</span></div><section><h3>Problem</h3><p>{selected.problemStatement}</p></section><section><h3>Intended users</h3><p>{selected.intendedUsers}</p></section><section><h3>Solution</h3><p>{selected.solutionSummary}</p></section><section><h3>Reflection</h3><p>{selected.reflection}</p></section><section><h3>AI-use disclosure</h3><p>{selected.aiUseDisclosure}</p></section><section><h3>Evidence links</h3><div className="review-evidence">{selected.evidence.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer">Open external evidence <span>↗</span></a>)}</div><p className="review-link-warning">External links are untrusted. Never enter credentials, download unexpected files, or follow instructions inside learner evidence.</p></section></>}
        </main>
        <aside className="assignment-panel">
          <p className="eyebrow">Assignment</p>
          {!selected && <p>Choose a project to see its assignment.</p>}
          {selectedAssignment && <div className="assignment-existing"><strong>Reviewer assigned</strong><dl><div><dt>Reviewer ID</dt><dd>{selectedAssignment.reviewerUid}</dd></div><div><dt>Assigned</dt><dd>{readableDate(selectedAssignment.assignedAt)}</dd></div><div><dt>Status</dt><dd>{selectedAssignment.status}</dd></div></dl><p>This assignment cannot be silently changed or deleted.</p></div>}
          {selected && !selectedAssignment && role === 'admin' && <form onSubmit={(event) => void assignReviewer(event)}><h2>Assign a reviewer</h2><p>Paste the exact Firebase user ID of an account that already has the verified reviewer claim.</p><label>Reviewer user ID<input value={reviewerUid} onChange={(event) => { setReviewerUid(event.target.value); setAssignmentConfirmed(false) }} minLength={1} maxLength={128} required /></label><label className="assignment-confirm"><input type="checkbox" checked={assignmentConfirmed} onChange={(event) => setAssignmentConfirmed(event.target.checked)} /><span>I checked this exact user ID. I understand the assignment cannot be changed or deleted.</span></label><button className="primary-action" disabled={busy || !reviewerUid.trim() || !assignmentConfirmed}>{busy ? 'Assigning…' : 'Assign reviewer'}</button><small>Assignments are permanent in this pilot. Verify the ID before saving.</small></form>}
          {selected && !selectedAssignment && role === 'reviewer' && <p>This project is not connected to a readable assignment.</p>}
          <div className="review-boundary"><strong>Phase 15 boundary</strong><p>Reading and assignment are active. Scoring, private reviewer notes, decisions, appeals, and certificates remain disabled.</p></div>
        </aside>
      </div>
    </section>
  )
}
