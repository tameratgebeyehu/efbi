import { getFirebaseFirestore } from './firebase'

export const deletionPolicyVersion = 'efbi-retention-v1'

export type DeletionRequestStatus = 'requested' | 'cancelled' | 'held' | 'completed'

export type DataDeletionRequest = {
  requestId: string
  learnerUid: string
  scope: 'account-and-learning-data'
  policyVersion: string
  status: DeletionRequestStatus
  requestedAt: unknown
  updatedAt: unknown
  completedAt: unknown
  certificateEvidenceRetained: boolean
}

export type DeletionCompletion = {
  completionId: string
  learnerUid: string
  policyVersion: string
  completedAt: unknown
  certificateEvidenceRetained: boolean
  authenticationRemoval: 'manual-console-required'
  deletedCategories: string[]
}

function safeString(value: unknown) { return typeof value === 'string' ? value : '' }

async function requireFirestore() {
  const services = await getFirebaseFirestore()
  if (!services) throw new Error('Privacy-request services are not connected yet.')
  return services
}

function asRequest(data: Record<string, unknown>): DataDeletionRequest {
  const status = safeString(data.status)
  return {
    requestId: safeString(data.requestId),
    learnerUid: safeString(data.learnerUid),
    scope: 'account-and-learning-data',
    policyVersion: safeString(data.policyVersion),
    status: ['cancelled', 'held', 'completed'].includes(status) ? status as DeletionRequestStatus : 'requested',
    requestedAt: data.requestedAt,
    updatedAt: data.updatedAt,
    completedAt: data.completedAt,
    certificateEvidenceRetained: data.certificateEvidenceRetained === true,
  }
}

function asCompletion(data: Record<string, unknown>): DeletionCompletion {
  return {
    completionId: safeString(data.completionId),
    learnerUid: safeString(data.learnerUid),
    policyVersion: safeString(data.policyVersion),
    completedAt: data.completedAt,
    certificateEvidenceRetained: data.certificateEvidenceRetained === true,
    authenticationRemoval: 'manual-console-required',
    deletedCategories: Array.isArray(data.deletedCategories) ? data.deletedCategories.filter((item): item is string => typeof item === 'string') : [],
  }
}

export async function readDeletionState(uid: string) {
  const services = await requireFirestore()
  const requestRef = services.firestoreSdk.doc(services.db, 'deletionRequests', uid)
  const completionRef = services.firestoreSdk.doc(services.db, 'deletionCompletions', uid)
  const [requestSnapshot, completionSnapshot] = await Promise.all([
    services.firestoreSdk.getDoc(requestRef),
    services.firestoreSdk.getDoc(completionRef),
  ])
  return {
    request: requestSnapshot.exists() ? asRequest(requestSnapshot.data()) : null,
    completion: completionSnapshot.exists() ? asCompletion(completionSnapshot.data()) : null,
  }
}

export async function createDeletionRequest(uid: string) {
  const services = await requireFirestore()
  const reference = services.firestoreSdk.doc(services.db, 'deletionRequests', uid)
  await services.firestoreSdk.setDoc(reference, {
    requestId: uid,
    learnerUid: uid,
    scope: 'account-and-learning-data',
    policyVersion: deletionPolicyVersion,
    status: 'requested',
    requestedAt: services.firestoreSdk.serverTimestamp(),
    updatedAt: services.firestoreSdk.serverTimestamp(),
    completedAt: null,
    certificateEvidenceRetained: false,
  })
  return readDeletionState(uid)
}

export async function setDeletionRequestActive(uid: string, active: boolean) {
  const services = await requireFirestore()
  const reference = services.firestoreSdk.doc(services.db, 'deletionRequests', uid)
  await services.firestoreSdk.updateDoc(reference, {
    status: active ? 'requested' : 'cancelled',
    updatedAt: services.firestoreSdk.serverTimestamp(),
  })
  return readDeletionState(uid)
}
