import { getFirebaseFirestore } from './firebase'

export const submissionId = 'ai-foundations-project'
export const revisionSubmissionId = 'ai-foundations-project-revision-1'
export const courseId = 'ai-foundations'
export const courseVersion = 1
export const assessmentVersion = 1
export const consentVersion = 'efbi-project-consent-v1'
export const revisionConsentVersion = 'efbi-project-revision-consent-v1'

export type SubmissionStatus = 'draft' | 'submitted'

export type ReviewScores = {
  localProblem: number
  usefulSolution: number
  evidence: number
  safetyResponsibility: number
  explanationReflection: number
}

export type LearnerReviewResult = {
  assignmentId: string
  submissionId: string
  courseVersion: number
  assessmentVersion: number
  rubricVersion: number
  scores: ReviewScores
  totalScore: number
  decision: 'approved' | 'revision_requested'
  publicFeedback: string
  reviewedAt: unknown
}

export type SubmissionForm = {
  projectTitle: string
  problemStatement: string
  intendedUsers: string
  solutionSummary: string
  evidence: [string, string, string]
  reflection: string
  aiUseDisclosure: string
}

export type ProjectSubmission = SubmissionForm & {
  submissionId: string
  courseId: string
  courseVersion: number
  assessmentVersion: number
  evidence: [string, string, string]
  consentVersion: string
  consentAcceptedAt: unknown
  status: SubmissionStatus
  createdAt: unknown
  updatedAt: unknown
  submittedAt: unknown
  revisionNumber: number
  originalSubmissionId: string
  basedOnReviewId: string
  originalSubmittedAt: unknown
  basedOnReviewReviewedAt: unknown
}

export const emptySubmissionForm: SubmissionForm = {
  projectTitle: '',
  problemStatement: '',
  intendedUsers: '',
  solutionSummary: '',
  evidence: ['', '', ''],
  reflection: '',
  aiUseDisclosure: '',
}

function safeString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function normalizeEvidence(value: unknown): [string, string, string] {
  const links = Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 3) : []
  return [links[0] ?? '', links[1] ?? '', links[2] ?? '']
}

function asSubmission(data: Record<string, unknown>): ProjectSubmission {
  return {
    submissionId: safeString(data.submissionId),
    courseId: safeString(data.courseId),
    courseVersion: typeof data.courseVersion === 'number' ? data.courseVersion : 1,
    assessmentVersion: typeof data.assessmentVersion === 'number' ? data.assessmentVersion : 1,
    projectTitle: safeString(data.projectTitle),
    problemStatement: safeString(data.problemStatement),
    intendedUsers: safeString(data.intendedUsers),
    solutionSummary: safeString(data.solutionSummary),
    evidence: normalizeEvidence(data.evidence),
    reflection: safeString(data.reflection),
    aiUseDisclosure: safeString(data.aiUseDisclosure),
    consentVersion: safeString(data.consentVersion),
    consentAcceptedAt: data.consentAcceptedAt,
    status: data.status === 'submitted' ? 'submitted' : 'draft',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    submittedAt: data.submittedAt,
    revisionNumber: typeof data.revisionNumber === 'number' ? data.revisionNumber : 0,
    originalSubmissionId: safeString(data.originalSubmissionId),
    basedOnReviewId: safeString(data.basedOnReviewId),
    originalSubmittedAt: data.originalSubmittedAt,
    basedOnReviewReviewedAt: data.basedOnReviewReviewedAt,
  }
}

export function normalizeSubmissionForm(form: SubmissionForm): SubmissionForm {
  return {
    projectTitle: form.projectTitle.trim(),
    problemStatement: form.problemStatement.trim(),
    intendedUsers: form.intendedUsers.trim(),
    solutionSummary: form.solutionSummary.trim(),
    evidence: form.evidence.map((link) => link.trim()) as [string, string, string],
    reflection: form.reflection.trim(),
    aiUseDisclosure: form.aiUseDisclosure.trim(),
  }
}

function validHttpsLink(value: string) {
  if (!value) return true
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && Boolean(url.hostname) && value.length <= 500
  } catch {
    return false
  }
}

export function draftErrors(form: SubmissionForm) {
  const normalized = normalizeSubmissionForm(form)
  const errors: string[] = []
  if (normalized.projectTitle.length > 100) errors.push('Project title must be 100 characters or fewer.')
  if (normalized.problemStatement.length > 1200) errors.push('Problem statement must be 1,200 characters or fewer.')
  if (normalized.intendedUsers.length > 600) errors.push('Intended users must be 600 characters or fewer.')
  if (normalized.solutionSummary.length > 2000) errors.push('Solution summary must be 2,000 characters or fewer.')
  if (normalized.reflection.length > 2000) errors.push('Reflection must be 2,000 characters or fewer.')
  if (normalized.aiUseDisclosure.length > 1200) errors.push('AI-use explanation must be 1,200 characters or fewer.')
  normalized.evidence.forEach((link, index) => {
    if (!validHttpsLink(link)) errors.push(`Evidence link ${index + 1} must be a complete HTTPS link.`)
  })
  return errors
}

export function finalErrors(form: SubmissionForm) {
  const normalized = normalizeSubmissionForm(form)
  const errors = draftErrors(normalized)
  if (normalized.projectTitle.length < 5) errors.push('Add a clear project title.')
  if (normalized.problemStatement.length < 40) errors.push('Explain the problem in at least 40 characters.')
  if (normalized.intendedUsers.length < 10) errors.push('Explain who the project is for.')
  if (normalized.solutionSummary.length < 50) errors.push('Explain your solution in at least 50 characters.')
  if (!normalized.evidence.some(Boolean)) errors.push('Add at least one HTTPS evidence link.')
  if (normalized.reflection.length < 50) errors.push('Write a reflection of at least 50 characters.')
  if (normalized.aiUseDisclosure.length < 20) errors.push('Explain honestly how you did or did not use AI.')
  return errors
}

async function requireFirestore() {
  const services = await getFirebaseFirestore()
  if (!services) throw new Error('Project submissions are not connected yet.')
  return services
}

export async function readSubmission(uid: string, recordId = submissionId) {
  const services = await requireFirestore()
  const reference = services.firestoreSdk.doc(services.db, 'users', uid, 'submissions', recordId)
  const snapshot = await services.firestoreSdk.getDoc(reference)
  return snapshot.exists() ? asSubmission(snapshot.data()) : null
}

export async function readLearnerReviewResult(uid: string, recordId = submissionId): Promise<LearnerReviewResult | null> {
  const services = await requireFirestore()
  const assignmentId = `${uid}--${recordId}`
  const reference = services.firestoreSdk.doc(services.db, 'users', uid, 'reviewResults', assignmentId)
  const snapshot = await services.firestoreSdk.getDoc(reference)
  if (!snapshot.exists()) return null
  const data = snapshot.data()
  const scores = data.scores && typeof data.scores === 'object' ? data.scores as Record<string, unknown> : {}
  const score = (key: string) => typeof scores[key] === 'number' ? scores[key] as number : 0
  return {
    assignmentId,
    submissionId: safeString(data.submissionId),
    courseVersion: typeof data.courseVersion === 'number' ? data.courseVersion : 1,
    assessmentVersion: typeof data.assessmentVersion === 'number' ? data.assessmentVersion : 1,
    rubricVersion: typeof data.rubricVersion === 'number' ? data.rubricVersion : 1,
    scores: { localProblem: score('localProblem'), usefulSolution: score('usefulSolution'), evidence: score('evidence'), safetyResponsibility: score('safetyResponsibility'), explanationReflection: score('explanationReflection') },
    totalScore: typeof data.totalScore === 'number' ? data.totalScore : 0,
    decision: data.decision === 'approved' ? 'approved' : 'revision_requested',
    publicFeedback: safeString(data.publicFeedback),
    reviewedAt: data.reviewedAt,
  }
}

export async function readSubmissionEligibility(uid: string) {
  const services = await requireFirestore()
  const reference = services.firestoreSdk.doc(services.db, 'users', uid, 'progress', courseId)
  const snapshot = await services.firestoreSdk.getDoc(reference)
  return snapshot.exists() && snapshot.data().percent === 100
}

export async function saveSubmissionDraft(uid: string, form: SubmissionForm, existing: ProjectSubmission | null) {
  const errors = draftErrors(form)
  if (errors.length) throw new Error(errors[0])
  if (existing?.status === 'submitted') throw new Error('Submitted work cannot be changed.')
  const services = await requireFirestore()
  const reference = services.firestoreSdk.doc(services.db, 'users', uid, 'submissions', submissionId)
  const normalized = normalizeSubmissionForm(form)
  await services.firestoreSdk.setDoc(reference, {
    submissionId,
    courseId,
    courseVersion,
    assessmentVersion,
    ...normalized,
    evidence: normalized.evidence.filter(Boolean),
    consentVersion: '',
    consentAcceptedAt: null,
    status: 'draft',
    createdAt: existing?.createdAt ?? services.firestoreSdk.serverTimestamp(),
    updatedAt: services.firestoreSdk.serverTimestamp(),
    submittedAt: null,
  })
  return readSubmission(uid)
}

export async function submitProject(uid: string, form: SubmissionForm, existing: ProjectSubmission) {
  const errors = finalErrors(form)
  if (errors.length) throw new Error(errors[0])
  if (existing.status !== 'draft') throw new Error('This project has already been submitted.')
  const services = await requireFirestore()
  const reference = services.firestoreSdk.doc(services.db, 'users', uid, 'submissions', submissionId)
  const normalized = normalizeSubmissionForm(form)
  await services.firestoreSdk.setDoc(reference, {
    submissionId,
    courseId,
    courseVersion: existing.courseVersion,
    assessmentVersion: existing.assessmentVersion,
    ...normalized,
    evidence: normalized.evidence.filter(Boolean),
    consentVersion,
    consentAcceptedAt: services.firestoreSdk.serverTimestamp(),
    status: 'submitted',
    createdAt: existing.createdAt,
    updatedAt: services.firestoreSdk.serverTimestamp(),
    submittedAt: services.firestoreSdk.serverTimestamp(),
  })
  return readSubmission(uid)
}

function revisionRecord(uid: string, form: SubmissionForm, existing: ProjectSubmission | null, original: ProjectSubmission, originalReview: LearnerReviewResult, services: Awaited<ReturnType<typeof requireFirestore>>, submitted: boolean) {
  const normalized = normalizeSubmissionForm(form)
  return {
    submissionId: revisionSubmissionId,
    originalSubmissionId: submissionId,
    revisionNumber: 1,
    basedOnReviewId: `${uid}--${submissionId}`,
    originalSubmittedAt: original.submittedAt,
    basedOnReviewReviewedAt: originalReview.reviewedAt,
    courseId,
    courseVersion: original.courseVersion,
    assessmentVersion: original.assessmentVersion,
    ...normalized,
    evidence: normalized.evidence.filter(Boolean),
    consentVersion: submitted ? revisionConsentVersion : '',
    consentAcceptedAt: submitted ? services.firestoreSdk.serverTimestamp() : null,
    status: submitted ? 'submitted' : 'draft',
    createdAt: existing?.createdAt ?? services.firestoreSdk.serverTimestamp(),
    updatedAt: services.firestoreSdk.serverTimestamp(),
    submittedAt: submitted ? services.firestoreSdk.serverTimestamp() : null,
  }
}

export async function saveSubmissionRevisionDraft(uid: string, form: SubmissionForm, existing: ProjectSubmission | null, original: ProjectSubmission, originalReview: LearnerReviewResult) {
  const errors = draftErrors(form)
  if (errors.length) throw new Error(errors[0])
  if (existing?.status === 'submitted') throw new Error('The submitted revision cannot be changed.')
  const services = await requireFirestore()
  const reference = services.firestoreSdk.doc(services.db, 'users', uid, 'submissions', revisionSubmissionId)
  await services.firestoreSdk.setDoc(reference, revisionRecord(uid, form, existing, original, originalReview, services, false))
  return readSubmission(uid, revisionSubmissionId)
}

export async function submitProjectRevision(uid: string, form: SubmissionForm, existing: ProjectSubmission, original: ProjectSubmission, originalReview: LearnerReviewResult) {
  const errors = finalErrors(form)
  if (errors.length) throw new Error(errors[0])
  if (existing.status !== 'draft') throw new Error('This revision has already been submitted.')
  const services = await requireFirestore()
  const reference = services.firestoreSdk.doc(services.db, 'users', uid, 'submissions', revisionSubmissionId)
  await services.firestoreSdk.setDoc(reference, revisionRecord(uid, form, existing, original, originalReview, services, true))
  return readSubmission(uid, revisionSubmissionId)
}
