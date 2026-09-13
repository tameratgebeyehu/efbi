import { getFirebaseFirestore } from './firebase'

export const submissionId = 'ai-foundations-project'
export const revisionSubmissionId = 'ai-foundations-project-revision-1'
export const consentVersion = 'efbi-project-consent-v1'
export const revisionConsentVersion = 'efbi-project-revision-consent-v1'

export type SubmissionCourse = {
  courseId: string
  courseTitle: string
  courseVersion: number
  assessmentVersion: number
  lessonCount: number
  versionId?: string
}

export function submissionRecordIds(course: SubmissionCourse) {
  if (!course.versionId) return { original: submissionId, revision: revisionSubmissionId }
  return {
    original: `${course.versionId}--project`,
    revision: `${course.versionId}--project-revision-1`,
  }
}

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
  courseId?: string
  versionId?: string
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
  versionId?: string
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
  projectTitle: '', problemStatement: '', intendedUsers: '', solutionSummary: '',
  evidence: ['', '', ''], reflection: '', aiUseDisclosure: '',
}

function safeString(value: unknown) { return typeof value === 'string' ? value : '' }
function safeNumber(value: unknown, fallback = 1) { return typeof value === 'number' ? value : fallback }
function normalizeEvidence(value: unknown): [string, string, string] {
  const links = Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 3) : []
  return [links[0] ?? '', links[1] ?? '', links[2] ?? '']
}
function asSubmission(data: Record<string, unknown>): ProjectSubmission {
  const record: ProjectSubmission = {
    submissionId: safeString(data.submissionId), courseId: safeString(data.courseId),
    courseVersion: safeNumber(data.courseVersion), assessmentVersion: safeNumber(data.assessmentVersion),
    projectTitle: safeString(data.projectTitle), problemStatement: safeString(data.problemStatement),
    intendedUsers: safeString(data.intendedUsers), solutionSummary: safeString(data.solutionSummary),
    evidence: normalizeEvidence(data.evidence), reflection: safeString(data.reflection), aiUseDisclosure: safeString(data.aiUseDisclosure),
    consentVersion: safeString(data.consentVersion), consentAcceptedAt: data.consentAcceptedAt,
    status: data.status === 'submitted' ? 'submitted' : 'draft', createdAt: data.createdAt,
    updatedAt: data.updatedAt, submittedAt: data.submittedAt,
    revisionNumber: safeNumber(data.revisionNumber, 0), originalSubmissionId: safeString(data.originalSubmissionId),
    basedOnReviewId: safeString(data.basedOnReviewId), originalSubmittedAt: data.originalSubmittedAt,
    basedOnReviewReviewedAt: data.basedOnReviewReviewedAt,
  }
  const versionId = safeString(data.versionId)
  if (versionId) record.versionId = versionId
  return record
}

export function normalizeSubmissionForm(form: SubmissionForm): SubmissionForm {
  return {
    projectTitle: form.projectTitle.trim(), problemStatement: form.problemStatement.trim(),
    intendedUsers: form.intendedUsers.trim(), solutionSummary: form.solutionSummary.trim(),
    evidence: form.evidence.map((link) => link.trim()) as [string, string, string],
    reflection: form.reflection.trim(), aiUseDisclosure: form.aiUseDisclosure.trim(),
  }
}
function validHttpsLink(value: string) {
  if (!value) return true
  try { const url = new URL(value); return url.protocol === 'https:' && Boolean(url.hostname) && value.length <= 500 } catch { return false }
}
export function draftErrors(form: SubmissionForm) {
  const value = normalizeSubmissionForm(form); const errors: string[] = []
  if (value.projectTitle.length > 100) errors.push('Project title must be 100 characters or fewer.')
  if (value.problemStatement.length > 1200) errors.push('Problem statement must be 1,200 characters or fewer.')
  if (value.intendedUsers.length > 600) errors.push('Intended users must be 600 characters or fewer.')
  if (value.solutionSummary.length > 2000) errors.push('Solution summary must be 2,000 characters or fewer.')
  if (value.reflection.length > 2000) errors.push('Reflection must be 2,000 characters or fewer.')
  if (value.aiUseDisclosure.length > 1200) errors.push('AI-use explanation must be 1,200 characters or fewer.')
  value.evidence.forEach((link, index) => { if (!validHttpsLink(link)) errors.push(`Evidence link ${index + 1} must be a complete HTTPS link.`) })
  return errors
}
export function finalErrors(form: SubmissionForm) {
  const value = normalizeSubmissionForm(form); const errors = draftErrors(value)
  if (value.projectTitle.length < 5) errors.push('Add a clear project title.')
  if (value.problemStatement.length < 40) errors.push('Explain the problem in at least 40 characters.')
  if (value.intendedUsers.length < 10) errors.push('Explain who the project is for.')
  if (value.solutionSummary.length < 50) errors.push('Explain your solution in at least 50 characters.')
  if (!value.evidence.some(Boolean)) errors.push('Add at least one HTTPS evidence link.')
  if (value.reflection.length < 50) errors.push('Write a reflection of at least 50 characters.')
  if (value.aiUseDisclosure.length < 20) errors.push('Explain honestly how you did or did not use AI.')
  return errors
}

async function requireFirestore() {
  const services = await getFirebaseFirestore()
  if (!services) throw new Error('Project submissions are not connected yet.')
  return services
}
export async function readSubmission(uid: string, recordId: string) {
  const services = await requireFirestore()
  const snapshot = await services.firestoreSdk.getDoc(services.firestoreSdk.doc(services.db, 'users', uid, 'submissions', recordId))
  return snapshot.exists() ? asSubmission(snapshot.data()) : null
}
export async function readLearnerReviewResult(uid: string, recordId: string): Promise<LearnerReviewResult | null> {
  const services = await requireFirestore(); const assignmentId = `${uid}--${recordId}`
  const snapshot = await services.firestoreSdk.getDoc(services.firestoreSdk.doc(services.db, 'users', uid, 'reviewResults', assignmentId))
  if (!snapshot.exists()) return null
  const data = snapshot.data(); const scores = data.scores && typeof data.scores === 'object' ? data.scores as Record<string, unknown> : {}
  const score = (key: string) => typeof scores[key] === 'number' ? scores[key] as number : 0
  const result: LearnerReviewResult = {
    assignmentId, submissionId: safeString(data.submissionId), courseVersion: safeNumber(data.courseVersion),
    assessmentVersion: safeNumber(data.assessmentVersion), rubricVersion: safeNumber(data.rubricVersion),
    scores: { localProblem: score('localProblem'), usefulSolution: score('usefulSolution'), evidence: score('evidence'), safetyResponsibility: score('safetyResponsibility'), explanationReflection: score('explanationReflection') },
    totalScore: safeNumber(data.totalScore, 0), decision: data.decision === 'approved' ? 'approved' : 'revision_requested',
    publicFeedback: safeString(data.publicFeedback), reviewedAt: data.reviewedAt,
  }
  const versionId = safeString(data.versionId); const resultCourseId = safeString(data.courseId)
  if (versionId) result.versionId = versionId
  if (resultCourseId) result.courseId = resultCourseId
  return result
}
export async function readSubmissionEligibility(uid: string, course: SubmissionCourse) {
  const services = await requireFirestore()
  const snapshot = await services.firestoreSdk.getDoc(services.firestoreSdk.doc(services.db, 'users', uid, 'progress', course.courseId))
  if (!snapshot.exists()) return false
  const data = snapshot.data()
  if (!course.versionId) return course.courseId === 'ai-foundations' && data.percent === 100
  return data.versionId === course.versionId
    && data.courseVersion === course.courseVersion
    && data.lessonCount === course.lessonCount
    && Array.isArray(data.completedLessonIds)
    && data.completedLessonIds.length === course.lessonCount
}
function courseFields(course: SubmissionCourse) {
  const fields: Record<string, unknown> = { courseId: course.courseId, courseVersion: course.courseVersion, assessmentVersion: course.assessmentVersion }
  if (course.versionId) fields.versionId = course.versionId
  return fields
}
export async function saveSubmissionDraft(uid: string, course: SubmissionCourse, form: SubmissionForm, existing: ProjectSubmission | null) {
  const errors = draftErrors(form); if (errors.length) throw new Error(errors[0])
  if (existing?.status === 'submitted') throw new Error('Submitted work cannot be changed.')
  const services = await requireFirestore(); const ids = submissionRecordIds(course); const normalized = normalizeSubmissionForm(form)
  await services.firestoreSdk.setDoc(services.firestoreSdk.doc(services.db, 'users', uid, 'submissions', ids.original), {
    submissionId: ids.original, ...courseFields(course), ...normalized, evidence: normalized.evidence.filter(Boolean),
    consentVersion: '', consentAcceptedAt: null, status: 'draft',
    createdAt: existing?.createdAt ?? services.firestoreSdk.serverTimestamp(), updatedAt: services.firestoreSdk.serverTimestamp(), submittedAt: null,
  })
  return readSubmission(uid, ids.original)
}
export async function submitProject(uid: string, course: SubmissionCourse, form: SubmissionForm, existing: ProjectSubmission) {
  const errors = finalErrors(form); if (errors.length) throw new Error(errors[0])
  if (existing.status !== 'draft') throw new Error('This project has already been submitted.')
  const services = await requireFirestore(); const ids = submissionRecordIds(course); const normalized = normalizeSubmissionForm(form)
  await services.firestoreSdk.setDoc(services.firestoreSdk.doc(services.db, 'users', uid, 'submissions', ids.original), {
    submissionId: ids.original, ...courseFields(course), ...normalized, evidence: normalized.evidence.filter(Boolean),
    consentVersion, consentAcceptedAt: services.firestoreSdk.serverTimestamp(), status: 'submitted', createdAt: existing.createdAt,
    updatedAt: services.firestoreSdk.serverTimestamp(), submittedAt: services.firestoreSdk.serverTimestamp(),
  })
  return readSubmission(uid, ids.original)
}
function revisionRecord(uid: string, course: SubmissionCourse, form: SubmissionForm, existing: ProjectSubmission | null, original: ProjectSubmission, originalReview: LearnerReviewResult, services: Awaited<ReturnType<typeof requireFirestore>>, submitted: boolean) {
  const normalized = normalizeSubmissionForm(form); const ids = submissionRecordIds(course)
  return {
    submissionId: ids.revision, originalSubmissionId: ids.original, revisionNumber: 1,
    basedOnReviewId: `${uid}--${ids.original}`, originalSubmittedAt: original.submittedAt,
    basedOnReviewReviewedAt: originalReview.reviewedAt, ...courseFields(course), ...normalized,
    evidence: normalized.evidence.filter(Boolean), consentVersion: submitted ? revisionConsentVersion : '',
    consentAcceptedAt: submitted ? services.firestoreSdk.serverTimestamp() : null, status: submitted ? 'submitted' : 'draft',
    createdAt: existing?.createdAt ?? services.firestoreSdk.serverTimestamp(), updatedAt: services.firestoreSdk.serverTimestamp(),
    submittedAt: submitted ? services.firestoreSdk.serverTimestamp() : null,
  }
}
export async function saveSubmissionRevisionDraft(uid: string, course: SubmissionCourse, form: SubmissionForm, existing: ProjectSubmission | null, original: ProjectSubmission, originalReview: LearnerReviewResult) {
  const errors = draftErrors(form); if (errors.length) throw new Error(errors[0])
  if (existing?.status === 'submitted') throw new Error('The submitted revision cannot be changed.')
  const services = await requireFirestore(); const ids = submissionRecordIds(course)
  await services.firestoreSdk.setDoc(services.firestoreSdk.doc(services.db, 'users', uid, 'submissions', ids.revision), revisionRecord(uid, course, form, existing, original, originalReview, services, false))
  return readSubmission(uid, ids.revision)
}
export async function submitProjectRevision(uid: string, course: SubmissionCourse, form: SubmissionForm, existing: ProjectSubmission, original: ProjectSubmission, originalReview: LearnerReviewResult) {
  const errors = finalErrors(form); if (errors.length) throw new Error(errors[0])
  if (existing.status !== 'draft') throw new Error('This revision has already been submitted.')
  const services = await requireFirestore(); const ids = submissionRecordIds(course)
  await services.firestoreSdk.setDoc(services.firestoreSdk.doc(services.db, 'users', uid, 'submissions', ids.revision), revisionRecord(uid, course, form, existing, original, originalReview, services, true))
  return readSubmission(uid, ids.revision)
}
