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
    await setDoc(doc(context.firestore(), 'courseDrafts', 'ai-foundations-v2'), {
      title: 'Private course draft',
      status: 'draft',
    })
    await setDoc(doc(context.firestore(), 'reviewAssignments', 'review-001'), {
      reviewerUid: 'reviewer-user',
      status: 'assigned',
    })
    await setDoc(doc(context.firestore(), 'adminAudit', 'event-001'), {
      action: 'phase9-test',
      actorUid: 'admin-user',
      createdAt: new Date('2026-09-11T00:00:00Z'),
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
    completedLessonIds: ['understanding-ai'],
    lastLessonId: 'understanding-ai',
    percent: 25,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

function twoLessonProgressRecord() {
  return {
    courseId: 'ai-foundations',
    completedLessonIds: ['understanding-ai', 'prompting-with-purpose'],
    lastLessonId: 'prompting-with-purpose',
    percent: 50,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

function threeLessonProgressRecord() {
  return {
    courseId: 'ai-foundations',
    completedLessonIds: ['understanding-ai', 'prompting-with-purpose', 'responsible-use'],
    lastLessonId: 'responsible-use',
    percent: 75,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

function fourLessonProgressRecord() {
  return {
    courseId: 'ai-foundations',
    completedLessonIds: ['understanding-ai', 'prompting-with-purpose', 'responsible-use', 'build-an-ethiopian-solution'],
    lastLessonId: 'build-an-ethiopian-solution',
    percent: 100,
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

test('progress accepts only published, unique lessons with a consistent percentage', async () => {
  const db = verifiedUser('alice')
  const reference = doc(db, 'users', 'alice', 'progress', 'ai-foundations')

  await assertFails(setDoc(reference, { ...progressRecord(), percent: 100 }))
  await assertFails(setDoc(reference, twoLessonProgressRecord()))
  await assertFails(setDoc(reference, threeLessonProgressRecord()))
  await assertFails(setDoc(reference, fourLessonProgressRecord()))
  await assertFails(setDoc(reference, { ...progressRecord(), completedLessonIds: ['unknown-lesson'], lastLessonId: 'unknown-lesson' }))
  await assertFails(setDoc(reference, { ...progressRecord(), completedLessonIds: ['understanding-ai', 'understanding-ai'], percent: 50 }))
  await assertFails(setDoc(reference, { ...progressRecord(), email: 'alice@example.com' }))
  await assertFails(setDoc(doc(db, 'users', 'alice', 'progress', 'another-course'), { ...progressRecord(), courseId: 'another-course' }))
})

test('a learner advances from Lesson 1 to Lesson 2 and 50 percent', async () => {
  const db = verifiedUser('alice')
  const reference = doc(db, 'users', 'alice', 'progress', 'ai-foundations')
  await assertSucceeds(setDoc(reference, progressRecord()))
  const firstProgress = await getDoc(reference)
  await assertSucceeds(setDoc(reference, {
    ...twoLessonProgressRecord(),
    createdAt: firstProgress.data().createdAt,
  }))
  const secondProgress = await getDoc(reference)
  assert.equal(secondProgress.data().percent, 50)
  assert.deepEqual(secondProgress.data().completedLessonIds, ['understanding-ai', 'prompting-with-purpose'])
})

test('a learner advances from Lesson 2 to Lesson 3 and 75 percent', async () => {
  const db = verifiedUser('alice')
  const reference = doc(db, 'users', 'alice', 'progress', 'ai-foundations')
  await assertSucceeds(setDoc(reference, progressRecord()))
  const firstProgress = await getDoc(reference)
  await assertSucceeds(setDoc(reference, {
    ...twoLessonProgressRecord(),
    createdAt: firstProgress.data().createdAt,
  }))
  const secondProgress = await getDoc(reference)
  await assertSucceeds(setDoc(reference, {
    ...threeLessonProgressRecord(),
    createdAt: secondProgress.data().createdAt,
  }))
  const thirdProgress = await getDoc(reference)
  assert.equal(thirdProgress.data().percent, 75)
  assert.deepEqual(thirdProgress.data().completedLessonIds, ['understanding-ai', 'prompting-with-purpose', 'responsible-use'])
})

test('a learner advances from Lesson 3 to Lesson 4 and 100 percent', async () => {
  const db = verifiedUser('alice')
  const reference = doc(db, 'users', 'alice', 'progress', 'ai-foundations')
  await assertSucceeds(setDoc(reference, progressRecord()))
  const firstProgress = await getDoc(reference)
  await assertSucceeds(setDoc(reference, { ...twoLessonProgressRecord(), createdAt: firstProgress.data().createdAt }))
  const secondProgress = await getDoc(reference)
  await assertSucceeds(setDoc(reference, { ...threeLessonProgressRecord(), createdAt: secondProgress.data().createdAt }))
  const thirdProgress = await getDoc(reference)
  await assertSucceeds(setDoc(reference, { ...fourLessonProgressRecord(), createdAt: thirdProgress.data().createdAt }))
  const finalProgress = await getDoc(reference)
  assert.equal(finalProgress.data().percent, 100)
  assert.deepEqual(finalProgress.data().completedLessonIds, ['understanding-ai', 'prompting-with-purpose', 'responsible-use', 'build-an-ethiopian-solution'])
})

test('a learner cannot skip from Lesson 2 directly to Lesson 4', async () => {
  const db = verifiedUser('alice')
  const reference = doc(db, 'users', 'alice', 'progress', 'ai-foundations')
  await assertSucceeds(setDoc(reference, progressRecord()))
  const firstProgress = await getDoc(reference)
  await assertSucceeds(setDoc(reference, { ...twoLessonProgressRecord(), createdAt: firstProgress.data().createdAt }))
  const secondProgress = await getDoc(reference)
  await assertFails(setDoc(reference, {
    ...fourLessonProgressRecord(),
    createdAt: secondProgress.data().createdAt,
  }))
})

test('a learner cannot skip from Lesson 1 directly to Lesson 3', async () => {
  const db = verifiedUser('alice')
  const reference = doc(db, 'users', 'alice', 'progress', 'ai-foundations')
  await assertSucceeds(setDoc(reference, progressRecord()))
  const firstProgress = await getDoc(reference)
  await assertFails(setDoc(reference, {
    ...threeLessonProgressRecord(),
    createdAt: firstProgress.data().createdAt,
  }))
})

test('completed progress cannot be reset or have its creation time rewritten', async () => {
  const db = verifiedUser('alice')
  const reference = doc(db, 'users', 'alice', 'progress', 'ai-foundations')
  await assertSucceeds(setDoc(reference, progressRecord()))
  const firstProgress = await getDoc(reference)
  await assertSucceeds(setDoc(reference, {
    ...twoLessonProgressRecord(),
    createdAt: firstProgress.data().createdAt,
  }))
  const secondProgress = await getDoc(reference)
  await assertSucceeds(setDoc(reference, {
    ...threeLessonProgressRecord(),
    createdAt: secondProgress.data().createdAt,
  }))
  const thirdProgress = await getDoc(reference)
  await assertSucceeds(setDoc(reference, {
    ...fourLessonProgressRecord(),
    createdAt: thirdProgress.data().createdAt,
  }))
  const finalProgress = await getDoc(reference)
  await assertFails(setDoc(reference, {
    ...threeLessonProgressRecord(),
    createdAt: finalProgress.data().createdAt,
  }))
  await assertFails(setDoc(reference, fourLessonProgressRecord()))
})

test('a certificate can be fetched by id but the registry cannot be listed', async () => {
  const db = environment.unauthenticatedContext().firestore()
  const result = await assertSucceeds(getDoc(doc(db, 'certificates', 'EFBI-DEMO-001')))
  assert.equal(result.data().status, 'active')
  await assertFails(getDocs(collection(db, 'certificates')))
})

test('an administrator can read reserved operational collections', async () => {
  const db = verifiedUser('admin-user', { admin: true })
  await assertSucceeds(getDoc(doc(db, 'courseDrafts', 'ai-foundations-v2')))
  await assertSucceeds(getDoc(doc(db, 'reviewAssignments', 'review-001')))
  await assertSucceeds(getDoc(doc(db, 'adminAudit', 'event-001')))
})

test('learners and support accounts cannot read private course or audit data', async () => {
  const learner = verifiedUser('alice')
  const support = verifiedUser('support-user', { support: true })
  for (const db of [learner, support]) {
    await assertFails(getDoc(doc(db, 'courseDrafts', 'ai-foundations-v2')))
    await assertFails(getDoc(doc(db, 'adminAudit', 'event-001')))
  }
})

test('a reviewer can read assignments but not course drafts or the admin audit', async () => {
  const db = verifiedUser('reviewer-user', { reviewer: true })
  await assertSucceeds(getDoc(doc(db, 'reviewAssignments', 'review-001')))
  await assertFails(getDoc(doc(db, 'courseDrafts', 'ai-foundations-v2')))
  await assertFails(getDoc(doc(db, 'adminAudit', 'event-001')))
})

test('all browser identities are denied writes to reserved Phase 9 collections', async () => {
  const identities = [
    verifiedUser('alice'),
    verifiedUser('admin-user', { admin: true }),
    verifiedUser('reviewer-user', { reviewer: true }),
  ]
  for (const db of identities) {
    await assertFails(setDoc(doc(db, 'courseDrafts', 'new-draft'), {
      title: 'Unvalidated draft',
      status: 'draft',
    }))
    await assertFails(setDoc(doc(db, 'reviewAssignments', 'new-assignment'), {
      reviewerUid: 'reviewer-user',
      status: 'assigned',
    }))
    await assertFails(setDoc(doc(db, 'adminAudit', 'new-event'), {
      action: 'untrusted-write',
      actorUid: 'admin-user',
      createdAt: serverTimestamp(),
    }))
  }
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
