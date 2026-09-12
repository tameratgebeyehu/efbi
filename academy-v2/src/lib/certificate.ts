import { getFirebaseFirestore } from './firebase'
import type { LearnerReviewResult } from './submission'

export const certificateCourseId = 'ai-foundations'
export const certificateCourseTitle = 'AI Foundations for Ethiopia'
export const certificateConsentVersion = 'efbi-certificate-public-v1'

export type CertificateRequest = {
  requestId: string
  learnerUid: string
  courseId: string
  publicName: string
  consentVersion: string
  consentAcceptedAt: unknown
  finalReviewId: string
  submissionId: string
  courseVersion: number
  assessmentVersion: number
  reviewedAt: unknown
  status: 'requested'
  createdAt: unknown
}

export type CertificateClaim = {
  claimId: string
  learnerUid: string
  courseId: string
  currentCredentialId: string
  createdAt: unknown
  updatedAt: unknown
  lastAuditId: string
}

export type PublicCertificate = {
  credentialId: string
  publicName: string
  courseId: string
  courseTitle: string
  issuedAt: unknown
  replacesCredentialId: string
}

export type PublicCertificateStatus = {
  credentialId: string
  status: 'active' | 'revoked' | 'replaced'
  updatedAt: unknown
  replacedBy: string
}

export type CertificateVerification = {
  certificate: PublicCertificate
  status: PublicCertificateStatus
}

function safeString(value: unknown) { return typeof value === 'string' ? value : '' }
function safeNumber(value: unknown) { return typeof value === 'number' ? value : 0 }

async function requireFirestore() {
  const services = await getFirebaseFirestore()
  if (!services) throw new Error('Certificate services are not connected yet.')
  return services
}

function asRequest(data: Record<string, unknown>): CertificateRequest {
  return {
    requestId: safeString(data.requestId), learnerUid: safeString(data.learnerUid), courseId: safeString(data.courseId),
    publicName: safeString(data.publicName), consentVersion: safeString(data.consentVersion), consentAcceptedAt: data.consentAcceptedAt,
    finalReviewId: safeString(data.finalReviewId), submissionId: safeString(data.submissionId), courseVersion: safeNumber(data.courseVersion),
    assessmentVersion: safeNumber(data.assessmentVersion), reviewedAt: data.reviewedAt, status: 'requested', createdAt: data.createdAt,
  }
}

function asClaim(data: Record<string, unknown>): CertificateClaim {
  return {
    claimId: safeString(data.claimId), learnerUid: safeString(data.learnerUid), courseId: safeString(data.courseId),
    currentCredentialId: safeString(data.currentCredentialId), createdAt: data.createdAt, updatedAt: data.updatedAt,
    lastAuditId: safeString(data.lastAuditId),
  }
}

export async function readCertificateRequest(uid: string) {
  const services = await requireFirestore()
  const reference = services.firestoreSdk.doc(services.db, 'users', uid, 'certificateRequests', certificateCourseId)
  const snapshot = await services.firestoreSdk.getDoc(reference)
  return snapshot.exists() ? asRequest(snapshot.data()) : null
}

export async function readOwnCertificateClaim(uid: string) {
  const services = await requireFirestore()
  const reference = services.firestoreSdk.doc(services.db, 'certificateClaims', `${uid}--${certificateCourseId}`)
  const snapshot = await services.firestoreSdk.getDoc(reference)
  return snapshot.exists() ? asClaim(snapshot.data()) : null
}

export async function createCertificateRequest(uid: string, publicName: string, result: LearnerReviewResult) {
  const name = publicName.trim().replace(/\s+/g, ' ')
  if (result.decision !== 'approved') throw new Error('A final approved review is required.')
  if (name.length < 2 || name.length > 80) throw new Error('Enter a public certificate name between 2 and 80 characters.')
  const services = await requireFirestore()
  const reference = services.firestoreSdk.doc(services.db, 'users', uid, 'certificateRequests', certificateCourseId)
  await services.firestoreSdk.setDoc(reference, {
    requestId: certificateCourseId,
    learnerUid: uid,
    courseId: certificateCourseId,
    publicName: name,
    consentVersion: certificateConsentVersion,
    consentAcceptedAt: services.firestoreSdk.serverTimestamp(),
    finalReviewId: result.assignmentId,
    submissionId: result.submissionId,
    courseVersion: result.courseVersion,
    assessmentVersion: result.assessmentVersion,
    reviewedAt: result.reviewedAt,
    status: 'requested',
    createdAt: services.firestoreSdk.serverTimestamp(),
  })
  return readCertificateRequest(uid)
}

export function normalizeCredentialId(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '')
}

export function validCredentialId(value: string) {
  return /^EFBI-[0-9]{4}-[A-Z0-9]{12}$/.test(normalizeCredentialId(value))
}

export async function verifyCertificate(value: string): Promise<CertificateVerification | null> {
  const credentialId = normalizeCredentialId(value)
  if (!validCredentialId(credentialId)) throw new Error('Enter a complete EFBI credential ID.')
  const services = await requireFirestore()
  const certificateRef = services.firestoreSdk.doc(services.db, 'certificates', credentialId)
  const statusRef = services.firestoreSdk.doc(services.db, 'certificateStatuses', credentialId)
  const [certificateSnapshot, statusSnapshot] = await Promise.all([
    services.firestoreSdk.getDoc(certificateRef), services.firestoreSdk.getDoc(statusRef),
  ])
  if (!certificateSnapshot.exists() || !statusSnapshot.exists()) return null
  const certificateData = certificateSnapshot.data()
  const statusData = statusSnapshot.data()
  const status = safeString(statusData.status)
  if (!['active', 'revoked', 'replaced'].includes(status)) return null
  return {
    certificate: {
      credentialId: safeString(certificateData.credentialId), publicName: safeString(certificateData.publicName),
      courseId: safeString(certificateData.courseId), courseTitle: safeString(certificateData.courseTitle),
      issuedAt: certificateData.issuedAt, replacesCredentialId: safeString(certificateData.replacesCredentialId),
    },
    status: {
      credentialId: safeString(statusData.credentialId), status: status as PublicCertificateStatus['status'],
      updatedAt: statusData.updatedAt, replacedBy: safeString(statusData.replacedBy),
    },
  }
}
