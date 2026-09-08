import { readFile } from 'node:fs/promises'
import { after, before, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'

let environment

before(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'demo-efbi',
    firestore: { rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') },
  })
})

beforeEach(async () => {
  await environment.clearFirestore()
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'certificates', 'EFBI-DEMO-001'), {
      credentialId: 'EFBI-DEMO-001',
      learnerName: 'Demo Learner',
      courseId: 'ai-foundations',
      courseTitle: 'AI Foundations for Ethiopia',
      issuedAt: new Date('2026-09-08T00:00:00Z'),
      status: 'active',
      public: true,
      updatedAt: new Date('2026-09-08T00:00:00Z'),
    })
  })
})

after(async () => {
  await environment.cleanup()
})

function verifiedUser(uid, claims = {}) {
  return environment.authenticatedContext(uid, { email_verified: true, ...claims }).firestore()
}

function progressRecord() {
  return {
    courseId: 'ai-foundations',
    completedLessonIds: ['what-is-ai'],
    lastLessonId: 'what-is-ai',
    percent: 25,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

test('an unauthenticated visitor cannot read learner data', async () => {
  const db = environment.unauthenticatedContext().firestore()
  await assertFails(getDoc(doc(db, 'users', 'alice')))
  await assertFails(getDoc(doc(db, 'users', 'alice', 'progress', 'ai-foundations')))
})

test('a learner can create a minimal profile for their own uid', async () => {
  const db = environment.authenticatedContext('alice', { email_verified: false }).firestore()
  await assertSucceeds(setDoc(doc(db, 'users', 'alice'), {
    displayName: 'Alice Learner',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))
  await assertFails(setDoc(doc(db, 'users', 'alice'), {
    displayName: 'Alice Learner',
    email: 'alice@example.com',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))
})

test('a verified learner can write and read only their progress', async () => {
  const alice = verifiedUser('alice')
  await assertSucceeds(setDoc(doc(alice, 'users', 'alice', 'progress', 'ai-foundations'), progressRecord()))
  await assertSucceeds(getDoc(doc(alice, 'users', 'alice', 'progress', 'ai-foundations')))

  const bob = verifiedUser('bob')
  await assertFails(getDoc(doc(bob, 'users', 'alice', 'progress', 'ai-foundations')))
  await assertFails(setDoc(doc(bob, 'users', 'alice', 'progress', 'ai-foundations'), progressRecord()))
})

test('an unverified learner cannot write course progress', async () => {
  const db = environment.authenticatedContext('alice', { email_verified: false }).firestore()
  await assertFails(setDoc(doc(db, 'users', 'alice', 'progress', 'ai-foundations'), progressRecord()))
})

test('progress rejects unexpected fields and invalid percentages', async () => {
  const db = verifiedUser('alice')
  await assertFails(setDoc(doc(db, 'users', 'alice', 'progress', 'ai-foundations'), { ...progressRecord(), percent: 101 }))
  await assertFails(setDoc(doc(db, 'users', 'alice', 'progress', 'ai-foundations'), { ...progressRecord(), email: 'alice@example.com' }))
})

test('a certificate can be fetched by id but the registry cannot be listed', async () => {
  const db = environment.unauthenticatedContext().firestore()
  const result = await assertSucceeds(getDoc(doc(db, 'certificates', 'EFBI-DEMO-001')))
  assert.equal(result.data().status, 'active')
  await assertFails(getDocs(collection(db, 'certificates')))
})

test('learners cannot issue certificates', async () => {
  const db = verifiedUser('alice')
  await assertFails(setDoc(doc(db, 'certificates', 'EFBI-FAKE-001'), {
    credentialId: 'EFBI-FAKE-001',
    learnerName: 'Alice Learner',
    courseId: 'ai-foundations',
    courseTitle: 'AI Foundations for Ethiopia',
    issuedAt: serverTimestamp(),
    status: 'active',
    public: true,
    updatedAt: serverTimestamp(),
  }))
})

test('an authenticated administrator can issue a public-safe certificate', async () => {
  const db = verifiedUser('admin-user', { admin: true })
  await assertSucceeds(setDoc(doc(db, 'certificates', 'EFBI-REAL-001'), {
    credentialId: 'EFBI-REAL-001',
    learnerName: 'Approved Learner',
    courseId: 'ai-foundations',
    courseTitle: 'AI Foundations for Ethiopia',
    issuedAt: serverTimestamp(),
    status: 'active',
    public: true,
    updatedAt: serverTimestamp(),
  }))
})
