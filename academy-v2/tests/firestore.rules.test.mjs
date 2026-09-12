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
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  setDoc,
  updateDoc,
  writeBatch,
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
    const draftContent = {
      title: 'AI Foundations — Second Edition',
      summary: 'A practical introduction to useful and responsible artificial intelligence.',
      description: 'Learners explore core AI ideas and turn one local need into a small, testable solution.',
      category: 'artificial-intelligence',
      level: 'beginner',
      language: 'English',
      estimatedMinutes: 240,
    }
    await setDoc(doc(context.firestore(), 'courseDrafts', 'ai-foundations-v2'), {
      courseId: 'ai-foundations-v2',
      ...draftContent,
      status: 'draft',
      revision: 1,
      latestReleaseNumber: 0,
      latestReleaseId: '',
      createdAt: new Date('2026-09-11T00:00:00Z'),
      createdBy: 'admin-user',
      updatedAt: new Date('2026-09-11T00:00:00Z'),
      updatedBy: 'admin-user',
      lastAuditId: 'audit-seed-draft-0001',
    })
    await setDoc(doc(context.firestore(), 'courseDrafts', 'ready-course'), {
      courseId: 'ready-course',
      ...draftContent,
      title: 'Ready Course for Publishing',
      status: 'ready',
      revision: 2,
      latestReleaseNumber: 0,
      latestReleaseId: '',
      createdAt: new Date('2026-09-11T00:00:00Z'),
      createdBy: 'admin-user',
      updatedAt: new Date('2026-09-11T01:00:00Z'),
      updatedBy: 'admin-user',
      lastAuditId: 'audit-seed-ready-0001',
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

function courseContent(overrides = {}) {
  return {
    title: 'Building Useful AI Projects',
    summary: 'A focused pathway from a clear community need to a responsible AI prototype.',
    description: 'Learners define one specific problem, examine the people affected, and test a small solution with care.',
    category: 'artificial-intelligence',
    level: 'beginner',
    language: 'English',
    estimatedMinutes: 180,
    ...overrides,
  }
}

function auditEvent({ eventId, action, entityType, entityId, actorUid = 'admin-user', revision, releaseId = '' }) {
  return {
    eventId,
    action,
    entityType,
    entityId,
    actorUid,
    revision,
    releaseId,
    createdAt: serverTimestamp(),
  }
}

function draftRecord({ courseId, auditId, actorUid = 'admin-user', ...overrides }) {
  return {
    courseId,
    ...courseContent(),
    status: 'draft',
    revision: 1,
    latestReleaseNumber: 0,
    latestReleaseId: '',
    createdAt: serverTimestamp(),
    createdBy: actorUid,
    updatedAt: serverTimestamp(),
    updatedBy: actorUid,
    lastAuditId: auditId,
    ...overrides,
  }
}

function addDraftCreation(batch, db, courseId, overrides = {}) {
  const auditId = `audit-create-${courseId}-0001`
  batch.set(doc(db, 'courseDrafts', courseId), draftRecord({ courseId, auditId, ...overrides }))
  batch.set(doc(db, 'adminAudit', auditId), auditEvent({
    eventId: auditId,
    action: 'course.draft.created',
    entityType: 'courseDraft',
    entityId: courseId,
    revision: 1,
  }))
  return auditId
}

function disabledQuestion() {
  return {
    enabled: false,
    prompt: '',
    options: ['', '', ''],
    correctOption: 0,
    explanation: '',
  }
}

function enabledQuestion(overrides = {}) {
  return {
    enabled: true,
    prompt: 'What should a learner do before trusting an AI answer?',
    options: ['Check the answer with a reliable source.', 'Copy it immediately.', 'Share private information first.'],
    correctOption: 0,
    explanation: 'Important AI answers should be checked before they are used.',
    ...overrides,
  }
}

function lessonRecord({ lessonId, auditId, actorUid = 'admin-user', ...overrides }) {
  return {
    lessonId,
    courseId: 'ai-foundations-v2',
    order: 1,
    title: 'Understanding AI safely',
    summary: 'A short lesson that helps learners understand AI and check important answers.',
    durationMinutes: 20,
    videoYoutubeId: '',
    bodyMarkdown: 'Artificial intelligence can help learners explore ideas, but every important answer needs human review. This lesson explains how to use AI carefully, protect private information, and check results before sharing them.',
    question1: enabledQuestion(),
    question2: disabledQuestion(),
    question3: disabledQuestion(),
    status: 'draft',
    revision: 1,
    latestReleaseNumber: 0,
    latestReleaseId: '',
    createdAt: serverTimestamp(),
    createdBy: actorUid,
    updatedAt: serverTimestamp(),
    updatedBy: actorUid,
    lastAuditId: auditId,
    ...overrides,
  }
}

function addLessonCreation(batch, db, lessonId, overrides = {}) {
  const auditId = `audit-create-${lessonId}-0001`
  batch.set(doc(db, 'lessonDrafts', lessonId), lessonRecord({ lessonId, auditId, ...overrides }))
  batch.set(doc(db, 'adminAudit', auditId), auditEvent({
    eventId: auditId,
    action: 'lesson.draft.created',
    entityType: 'lessonDraft',
    entityId: lessonId,
    revision: 1,
  }))
  return auditId
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

test('non-administrative browser identities cannot write operational collections', async () => {
  const identities = [
    verifiedUser('alice'),
    verifiedUser('reviewer-user', { reviewer: true }),
    verifiedUser('support-user', { support: true }),
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

test('an administrator creates a validated draft and linked audit atomically', async () => {
  const db = verifiedUser('admin-user', { admin: true })
  const batch = writeBatch(db)
  const courseId = 'community-ai-lab'
  const auditId = addDraftCreation(batch, db, courseId)
  await assertSucceeds(batch.commit())

  const draft = await getDoc(doc(db, 'courseDrafts', courseId))
  const audit = await getDoc(doc(db, 'adminAudit', auditId))
  assert.equal(draft.data().revision, 1)
  assert.equal(draft.data().status, 'draft')
  assert.equal(audit.data().action, 'course.draft.created')
})

test('draft creation rejects missing audits, invalid slugs, extra fields, and forged actors', async () => {
  const db = verifiedUser('admin-user', { admin: true })
  await assertFails(setDoc(doc(db, 'courseDrafts', 'missing-audit'), draftRecord({
    courseId: 'missing-audit',
    auditId: 'audit-missing-link-0001',
  })))

  for (const [courseId, overrides] of [
    ['Invalid Course ID', {}],
    ['extra-field-course', { unexpected: true }],
    ['forged-actor-course', { createdBy: 'different-admin', updatedBy: 'different-admin' }],
    ['short-summary-course', { summary: 'Too short' }],
  ]) {
    const batch = writeBatch(db)
    addDraftCreation(batch, db, courseId, overrides)
    await assertFails(batch.commit())
  }
})

test('an administrator updates a draft with one revision and an immutable audit event', async () => {
  const db = verifiedUser('admin-user', { admin: true })
  const reference = doc(db, 'courseDrafts', 'ai-foundations-v2')
  const current = (await getDoc(reference)).data()
  const auditId = 'audit-update-ai-foundations-v2-0002'
  const batch = writeBatch(db)
  batch.update(reference, {
    ...current,
    title: 'AI Foundations — Reviewed Edition',
    status: 'ready',
    revision: 2,
    updatedAt: serverTimestamp(),
    updatedBy: 'admin-user',
    lastAuditId: auditId,
  })
  batch.set(doc(db, 'adminAudit', auditId), auditEvent({
    eventId: auditId,
    action: 'course.draft.updated',
    entityType: 'courseDraft',
    entityId: 'ai-foundations-v2',
    revision: 2,
  }))
  await assertSucceeds(batch.commit())
  assert.equal((await getDoc(reference)).data().status, 'ready')
})

test('a no-op draft update cannot create a meaningless revision or audit event', async () => {
  const db = verifiedUser('admin-user', { admin: true })
  const reference = doc(db, 'courseDrafts', 'ai-foundations-v2')
  const current = (await getDoc(reference)).data()
  const auditId = 'audit-noop-ai-foundations-v2-0002'
  const batch = writeBatch(db)
  batch.update(reference, {
    ...current,
    revision: 2,
    updatedAt: serverTimestamp(),
    updatedBy: 'admin-user',
    lastAuditId: auditId,
  })
  batch.set(doc(db, 'adminAudit', auditId), auditEvent({
    eventId: auditId,
    action: 'course.draft.updated',
    entityType: 'courseDraft',
    entityId: 'ai-foundations-v2',
    revision: 2,
  }))
  await assertFails(batch.commit())
})

test('draft updates reject skipped revisions, changed ownership, and deletion', async () => {
  const db = verifiedUser('admin-user', { admin: true })
  const reference = doc(db, 'courseDrafts', 'ai-foundations-v2')
  const current = (await getDoc(reference)).data()

  for (const [auditId, changes] of [
    ['audit-skipped-revision-0003', { revision: 3 }],
    ['audit-changed-owner-0002', { revision: 2, createdBy: 'another-admin' }],
  ]) {
    const batch = writeBatch(db)
    batch.update(reference, {
      ...current,
      ...changes,
      updatedAt: serverTimestamp(),
      updatedBy: 'admin-user',
      lastAuditId: auditId,
    })
    batch.set(doc(db, 'adminAudit', auditId), auditEvent({
      eventId: auditId,
      action: 'course.draft.updated',
      entityType: 'courseDraft',
      entityId: 'ai-foundations-v2',
      revision: changes.revision,
    }))
    await assertFails(batch.commit())
  }
  await assertFails(deleteDoc(reference))
})

test('a review-ready draft publishes as one immutable release and audit event', async () => {
  const db = verifiedUser('admin-user', { admin: true })
  const draftReference = doc(db, 'courseDrafts', 'ready-course')
  const current = (await getDoc(draftReference)).data()
  const releaseId = 'release-ready-course-v0001-abc12345'
  const auditId = 'audit-publish-ready-course-v0001'
  const nextRevision = current.revision + 1
  const batch = writeBatch(db)
  batch.update(draftReference, {
    ...current,
    status: 'published',
    revision: nextRevision,
    latestReleaseNumber: 1,
    latestReleaseId: releaseId,
    updatedAt: serverTimestamp(),
    updatedBy: 'admin-user',
    lastAuditId: auditId,
  })
  batch.set(doc(db, 'courseReleases', releaseId), {
    releaseId,
    courseId: 'ready-course',
    title: current.title,
    summary: current.summary,
    description: current.description,
    category: current.category,
    level: current.level,
    language: current.language,
    estimatedMinutes: current.estimatedMinutes,
    version: 1,
    draftRevision: nextRevision,
    publishedAt: serverTimestamp(),
    publishedBy: 'admin-user',
    auditId,
  })
  batch.set(doc(db, 'adminAudit', auditId), auditEvent({
    eventId: auditId,
    action: 'course.release.published',
    entityType: 'courseRelease',
    entityId: 'ready-course',
    revision: nextRevision,
    releaseId,
  }))
  await assertSucceeds(batch.commit())

  const learner = verifiedUser('alice')
  const releaseReference = doc(learner, 'courseReleases', releaseId)
  assert.equal((await assertSucceeds(getDoc(releaseReference))).data().version, 1)
  const visitor = environment.unauthenticatedContext().firestore()
  await assertFails(getDoc(doc(visitor, 'courseReleases', releaseId)))
  await assertFails(updateDoc(doc(db, 'courseReleases', releaseId), { title: 'Changed later' }))
  await assertFails(deleteDoc(doc(db, 'courseReleases', releaseId)))
})

test('publishing rejects unreviewed, changed, incomplete, or unlinked releases', async () => {
  const db = verifiedUser('admin-user', { admin: true })

  async function attempt(courseId, { changeTitle = false, includeRelease = true } = {}) {
    const draftReference = doc(db, 'courseDrafts', courseId)
    const current = (await getDoc(draftReference)).data()
    const releaseId = `release-${courseId}-v0001-abc12345`
    const auditId = `audit-publish-${courseId}-v0001`
    const nextRevision = current.revision + 1
    const nextTitle = changeTitle ? `${current.title} changed during publish` : current.title
    const batch = writeBatch(db)
    batch.update(draftReference, {
      ...current,
      title: nextTitle,
      status: 'published',
      revision: nextRevision,
      latestReleaseNumber: 1,
      latestReleaseId: releaseId,
      updatedAt: serverTimestamp(),
      updatedBy: 'admin-user',
      lastAuditId: auditId,
    })
    if (includeRelease) {
      batch.set(doc(db, 'courseReleases', releaseId), {
        releaseId,
        courseId,
        ...courseContent({ title: nextTitle }),
        version: 1,
        draftRevision: nextRevision,
        publishedAt: serverTimestamp(),
        publishedBy: 'admin-user',
        auditId,
      })
    }
    batch.set(doc(db, 'adminAudit', auditId), auditEvent({
      eventId: auditId,
      action: 'course.release.published',
      entityType: 'courseRelease',
      entityId: courseId,
      revision: nextRevision,
      releaseId,
    }))
    return assertFails(batch.commit())
  }

  await attempt('ai-foundations-v2')
  await attempt('ready-course', { changeTitle: true })
  await attempt('ready-course', { includeRelease: false })
})

test('audit events are administrator-readable and immutable', async () => {
  const db = verifiedUser('admin-user', { admin: true })
  const reference = doc(db, 'adminAudit', 'event-001')
  await assertSucceeds(getDoc(reference))
  await assertFails(updateDoc(reference, { action: 'course.draft.updated' }))
  await assertFails(deleteDoc(reference))
})

test('an administrator cannot create an orphan or invented audit event', async () => {
  const db = verifiedUser('admin-user', { admin: true })
  const eventId = 'audit-orphan-course-event-0001'
  await assertFails(setDoc(doc(db, 'adminAudit', eventId), auditEvent({
    eventId,
    action: 'course.draft.updated',
    entityType: 'courseDraft',
    entityId: 'missing-course',
    revision: 2,
  })))
})

test('an administrator creates a validated lesson draft and linked audit atomically', async () => {
  const db = verifiedUser('admin-user', { admin: true })
  const batch = writeBatch(db)
  const lessonId = 'safe-ai-start'
  const auditId = addLessonCreation(batch, db, lessonId)
  await assertSucceeds(batch.commit())

  const lesson = await getDoc(doc(db, 'lessonDrafts', lessonId))
  const audit = await getDoc(doc(db, 'adminAudit', auditId))
  assert.equal(lesson.data().revision, 1)
  assert.equal(lesson.data().status, 'draft')
  assert.equal(audit.data().action, 'lesson.draft.created')
})

test('lesson drafts stay private to administrators', async () => {
  const adminDb = verifiedUser('admin-user', { admin: true })
  const batch = writeBatch(adminDb)
  addLessonCreation(batch, adminDb, 'private-lesson')
  await assertSucceeds(batch.commit())

  await assertSucceeds(getDoc(doc(adminDb, 'lessonDrafts', 'private-lesson')))
  await assertFails(getDoc(doc(verifiedUser('alice'), 'lessonDrafts', 'private-lesson')))
  await assertFails(getDoc(doc(verifiedUser('reviewer-user', { reviewer: true }), 'lessonDrafts', 'private-lesson')))
})

test('lesson creation rejects missing audits, invalid question state, invalid video IDs, and forged actors', async () => {
  const db = verifiedUser('admin-user', { admin: true })
  await assertFails(setDoc(doc(db, 'lessonDrafts', 'missing-lesson-audit'), lessonRecord({
    lessonId: 'missing-lesson-audit',
    auditId: 'audit-missing-lesson-link-0001',
  })))

  for (const [lessonId, overrides] of [
    ['bad-question-lesson', { question1: enabledQuestion({ options: ['Only one option'] }) }],
    ['bad-disabled-question', { question2: { ...disabledQuestion(), prompt: 'Should stay empty' } }],
    ['bad-video-id', { videoYoutubeId: 'not-a-valid-id' }],
    ['forged-lesson-actor', { createdBy: 'another-admin', updatedBy: 'another-admin' }],
    ['unknown-lesson-field', { unexpected: true }],
  ]) {
    const batch = writeBatch(db)
    addLessonCreation(batch, db, lessonId, overrides)
    await assertFails(batch.commit())
  }
})

test('an administrator updates a lesson draft with one revision and audit event', async () => {
  const db = verifiedUser('admin-user', { admin: true })
  const createBatch = writeBatch(db)
  addLessonCreation(createBatch, db, 'update-lesson')
  await assertSucceeds(createBatch.commit())

  const reference = doc(db, 'lessonDrafts', 'update-lesson')
  const current = (await getDoc(reference)).data()
  const auditId = 'audit-update-lesson-0002'
  const batch = writeBatch(db)
  batch.update(reference, {
    ...current,
    title: 'Understanding AI with review',
    status: 'ready',
    revision: 2,
    updatedAt: serverTimestamp(),
    updatedBy: 'admin-user',
    lastAuditId: auditId,
  })
  batch.set(doc(db, 'adminAudit', auditId), auditEvent({
    eventId: auditId,
    action: 'lesson.draft.updated',
    entityType: 'lessonDraft',
    entityId: 'update-lesson',
    revision: 2,
  }))
  await assertSucceeds(batch.commit())
  assert.equal((await getDoc(reference)).data().status, 'ready')
})

test('lesson updates reject no-ops, skipped revisions, changed ownership, and deletion', async () => {
  const db = verifiedUser('admin-user', { admin: true })
  const createBatch = writeBatch(db)
  addLessonCreation(createBatch, db, 'guarded-lesson')
  await assertSucceeds(createBatch.commit())

  const reference = doc(db, 'lessonDrafts', 'guarded-lesson')
  const current = (await getDoc(reference)).data()

  for (const [auditId, changes] of [
    ['audit-noop-lesson-0002', { revision: 2 }],
    ['audit-skip-lesson-0003', { revision: 3, title: 'Skipped lesson revision' }],
    ['audit-owner-lesson-0002', { revision: 2, title: 'Changed owner lesson', createdBy: 'another-admin' }],
  ]) {
    const batch = writeBatch(db)
    batch.update(reference, {
      ...current,
      ...changes,
      updatedAt: serverTimestamp(),
      updatedBy: 'admin-user',
      lastAuditId: auditId,
    })
    batch.set(doc(db, 'adminAudit', auditId), auditEvent({
      eventId: auditId,
      action: 'lesson.draft.updated',
      entityType: 'lessonDraft',
      entityId: 'guarded-lesson',
      revision: changes.revision,
    }))
    await assertFails(batch.commit())
  }
  await assertFails(deleteDoc(reference))
})

test('a review-ready lesson publishes as one immutable release and audit event', async () => {
  const db = verifiedUser('admin-user', { admin: true })
  const createBatch = writeBatch(db)
  addLessonCreation(createBatch, db, 'publishable-lesson')
  await assertSucceeds(createBatch.commit())

  const reference = doc(db, 'lessonDrafts', 'publishable-lesson')
  const currentDraft = (await getDoc(reference)).data()
  const readyAuditId = 'audit-ready-publishable-lesson-0002'
  const readyBatch = writeBatch(db)
  readyBatch.update(reference, {
    ...currentDraft,
    status: 'ready',
    revision: 2,
    updatedAt: serverTimestamp(),
    updatedBy: 'admin-user',
    lastAuditId: readyAuditId,
  })
  readyBatch.set(doc(db, 'adminAudit', readyAuditId), auditEvent({
    eventId: readyAuditId,
    action: 'lesson.draft.updated',
    entityType: 'lessonDraft',
    entityId: 'publishable-lesson',
    revision: 2,
  }))
  await assertSucceeds(readyBatch.commit())

  const readyDraft = (await getDoc(reference)).data()
  const releaseId = 'release-publishable-lesson-v0001'
  const publishAuditId = 'audit-publishable-lesson-v0001'
  const publishRevision = readyDraft.revision + 1
  const publishBatch = writeBatch(db)
  publishBatch.update(reference, {
    ...readyDraft,
    status: 'published',
    revision: publishRevision,
    latestReleaseNumber: 1,
    latestReleaseId: releaseId,
    updatedAt: serverTimestamp(),
    updatedBy: 'admin-user',
    lastAuditId: publishAuditId,
  })
  publishBatch.set(doc(db, 'lessonReleases', releaseId), {
    releaseId,
    lessonId: 'publishable-lesson',
    courseId: readyDraft.courseId,
    order: readyDraft.order,
    title: readyDraft.title,
    summary: readyDraft.summary,
    durationMinutes: readyDraft.durationMinutes,
    videoYoutubeId: readyDraft.videoYoutubeId,
    bodyMarkdown: readyDraft.bodyMarkdown,
    question1: readyDraft.question1,
    question2: readyDraft.question2,
    question3: readyDraft.question3,
    version: 1,
    draftRevision: publishRevision,
    publishedAt: serverTimestamp(),
    publishedBy: 'admin-user',
    auditId: publishAuditId,
  })
  publishBatch.set(doc(db, 'adminAudit', publishAuditId), auditEvent({
    eventId: publishAuditId,
    action: 'lesson.release.published',
    entityType: 'lessonRelease',
    entityId: 'publishable-lesson',
    revision: publishRevision,
    releaseId,
  }))
  await assertSucceeds(publishBatch.commit())

  const learner = verifiedUser('alice')
  assert.equal((await assertSucceeds(getDoc(doc(learner, 'lessonReleases', releaseId)))).data().version, 1)
  await assertFails(getDoc(doc(environment.unauthenticatedContext().firestore(), 'lessonReleases', releaseId)))
  await assertFails(updateDoc(doc(db, 'lessonReleases', releaseId), { title: 'Changed later' }))
  await assertFails(deleteDoc(doc(db, 'lessonReleases', releaseId)))
})

test('lesson publishing rejects unready, changed, incomplete, or unlinked releases', async () => {
  const db = verifiedUser('admin-user', { admin: true })
  const createBatch = writeBatch(db)
  addLessonCreation(createBatch, db, 'blocked-publish-lesson')
  await assertSucceeds(createBatch.commit())

  async function attempt({ makeReady = false, changeTitle = false, includeRelease = true } = {}) {
    const reference = doc(db, 'lessonDrafts', 'blocked-publish-lesson')
    if (makeReady) {
      const initial = (await getDoc(reference)).data()
      const readyAuditId = 'audit-ready-blocked-publish-lesson-0002'
      const readyBatch = writeBatch(db)
      readyBatch.update(reference, {
        ...initial,
        status: 'ready',
        revision: 2,
        updatedAt: serverTimestamp(),
        updatedBy: 'admin-user',
        lastAuditId: readyAuditId,
      })
      readyBatch.set(doc(db, 'adminAudit', readyAuditId), auditEvent({
        eventId: readyAuditId,
        action: 'lesson.draft.updated',
        entityType: 'lessonDraft',
        entityId: 'blocked-publish-lesson',
        revision: 2,
      }))
      await assertSucceeds(readyBatch.commit())
    }
    const current = (await getDoc(reference)).data()
    const releaseId = `release-blocked-publish-${current.revision}`
    const auditId = `audit-blocked-publish-${current.revision}`
    const nextRevision = current.revision + 1
    const nextTitle = changeTitle ? `${current.title} changed` : current.title
    const batch = writeBatch(db)
    batch.update(reference, {
      ...current,
      title: nextTitle,
      status: 'published',
      revision: nextRevision,
      latestReleaseNumber: current.latestReleaseNumber + 1,
      latestReleaseId: releaseId,
      updatedAt: serverTimestamp(),
      updatedBy: 'admin-user',
      lastAuditId: auditId,
    })
    if (includeRelease) {
      batch.set(doc(db, 'lessonReleases', releaseId), {
        releaseId,
        lessonId: 'blocked-publish-lesson',
        courseId: current.courseId,
        order: current.order,
        title: nextTitle,
        summary: current.summary,
        durationMinutes: current.durationMinutes,
        videoYoutubeId: current.videoYoutubeId,
        bodyMarkdown: current.bodyMarkdown,
        question1: current.question1,
        question2: current.question2,
        question3: current.question3,
        version: current.latestReleaseNumber + 1,
        draftRevision: nextRevision,
        publishedAt: serverTimestamp(),
        publishedBy: 'admin-user',
        auditId,
      })
    }
    batch.set(doc(db, 'adminAudit', auditId), auditEvent({
      eventId: auditId,
      action: 'lesson.release.published',
      entityType: 'lessonRelease',
      entityId: 'blocked-publish-lesson',
      revision: nextRevision,
      releaseId,
    }))
    return assertFails(batch.commit())
  }

  await attempt()
  await attempt({ makeReady: true, changeTitle: true })
  await attempt({ includeRelease: false })
})
test('non-administrators cannot create lesson drafts or lesson audit events', async () => {
  for (const db of [verifiedUser('alice'), verifiedUser('reviewer-user', { reviewer: true })]) {
    const batch = writeBatch(db)
    addLessonCreation(batch, db, 'blocked-lesson')
    await assertFails(batch.commit())
    await assertFails(setDoc(doc(db, 'adminAudit', 'audit-blocked-lesson-0001'), auditEvent({
      eventId: 'audit-blocked-lesson-0001',
      action: 'lesson.draft.created',
      entityType: 'lessonDraft',
      entityId: 'blocked-lesson',
      revision: 1,
    })))
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

test('legacy standalone certificate writes remain closed even to administrators', async () => {
  const db = verifiedUser('admin-user', { admin: true })
  await assertFails(setDoc(doc(db, 'certificates', 'EFBI-BLOCKED-001'), {
    credentialId: 'EFBI-BLOCKED-001',
    learnerName: 'Approved Learner',
    courseId: 'ai-foundations',
    courseTitle: 'AI Foundations for Ethiopia',
    issuedAt: serverTimestamp(),
    status: 'active',
    public: true,
    updatedAt: serverTimestamp(),
  }))
})


function submissionDraft(overrides = {}) {
  return {
    submissionId: 'ai-foundations-project',
    courseId: 'ai-foundations',
    courseVersion: 1,
    assessmentVersion: 1,
    projectTitle: 'Safer school information helper',
    problemStatement: 'Students need a clearer way to find accurate school schedule information without sharing private details.',
    intendedUsers: 'Students and teachers at one local school.',
    solutionSummary: 'A small question-and-answer guide that uses reviewed school information and tells students when to ask a teacher.',
    evidence: ['https://example.org/project-demo'],
    reflection: 'I learned that a useful solution needs a narrow problem, feedback from intended users, and clear limits.',
    aiUseDisclosure: 'I used AI to improve wording, then checked and rewrote every important statement myself.',
    consentVersion: '',
    consentAcceptedAt: null,
    status: 'draft',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    submittedAt: null,
    ...overrides,
  }
}

function finalSubmission(createdAt, overrides = {}) {
  return submissionDraft({
    createdAt,
    consentVersion: 'efbi-project-consent-v1',
    consentAcceptedAt: serverTimestamp(),
    status: 'submitted',
    updatedAt: serverTimestamp(),
    submittedAt: serverTimestamp(),
    ...overrides,
  })
}

async function seedCompletedProgress(uid) {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users', uid, 'progress', 'ai-foundations'), {
      courseId: 'ai-foundations',
      completedLessonIds: ['understanding-ai', 'prompting-with-purpose', 'responsible-use', 'build-an-ethiopian-solution'],
      lastLessonId: 'build-an-ethiopian-solution',
      percent: 100,
      createdAt: new Date('2026-09-12T00:00:00Z'),
      updatedAt: new Date('2026-09-12T00:00:00Z'),
    })
  })
}

async function seedSubmittedProject(uid, reviewerUid = '') {
  await seedCompletedProgress(uid)
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, 'users', uid, 'submissions', 'ai-foundations-project'), {
      ...submissionDraft(),
      createdAt: new Date('2026-09-12T00:00:00Z'),
      updatedAt: new Date('2026-09-12T00:10:00Z'),
      consentVersion: 'efbi-project-consent-v1',
      consentAcceptedAt: new Date('2026-09-12T00:10:00Z'),
      status: 'submitted',
      submittedAt: new Date('2026-09-12T00:10:00Z'),
    })
    if (reviewerUid) {
      const assignmentId = uid + '--ai-foundations-project'
      await setDoc(doc(db, 'reviewAssignments', assignmentId), {
        assignmentId,
        learnerUid: uid,
        submissionId: 'ai-foundations-project',
        reviewerUid,
        status: 'assigned',
        assignedAt: new Date('2026-09-12T00:15:00Z'),
        assignedBy: 'admin-user',
      })
    }
  })
}

test('a completed learner can create, read, and update an own project draft', async () => {
  await seedCompletedProgress('alice')
  const db = verifiedUser('alice')
  const reference = doc(db, 'users', 'alice', 'submissions', 'ai-foundations-project')
  await assertSucceeds(setDoc(reference, submissionDraft()))
  const saved = await assertSucceeds(getDoc(reference))
  await assertSucceeds(setDoc(reference, submissionDraft({
    createdAt: saved.data().createdAt,
    projectTitle: 'Improved school information helper',
  })))
})

test('course completion is required before a learner can create a project draft', async () => {
  const db = verifiedUser('alice')
  await assertFails(setDoc(doc(db, 'users', 'alice', 'submissions', 'ai-foundations-project'), submissionDraft()))
})

test('submission drafts reject unsafe links, unknown fields, and cross-user reads', async () => {
  await seedCompletedProgress('alice')
  const alice = verifiedUser('alice')
  const reference = doc(alice, 'users', 'alice', 'submissions', 'ai-foundations-project')
  await assertFails(setDoc(reference, submissionDraft({ evidence: ['http://example.org/not-secure'] })))
  await assertFails(setDoc(reference, submissionDraft({ unexpectedPrivateField: 'not allowed' })))
  await assertSucceeds(setDoc(reference, submissionDraft()))
  await assertFails(getDoc(doc(verifiedUser('bob'), 'users', 'alice', 'submissions', 'ai-foundations-project')))
})

test('final submission requires explicit consent and becomes immutable', async () => {
  await seedCompletedProgress('alice')
  const db = verifiedUser('alice')
  const reference = doc(db, 'users', 'alice', 'submissions', 'ai-foundations-project')
  await assertSucceeds(setDoc(reference, submissionDraft()))
  const draft = await getDoc(reference)
  await assertFails(setDoc(reference, submissionDraft({
    createdAt: draft.data().createdAt,
    status: 'submitted',
  })))
  await assertSucceeds(setDoc(reference, finalSubmission(draft.data().createdAt)))
  const submitted = await getDoc(reference)
  await assertFails(setDoc(reference, finalSubmission(submitted.data().createdAt, { projectTitle: 'Changed after submit' })))
  await assertFails(deleteDoc(reference))
})

test('administrators see submitted work but cannot open private drafts', async () => {
  await seedCompletedProgress('alice')
  const alice = verifiedUser('alice')
  const reference = doc(alice, 'users', 'alice', 'submissions', 'ai-foundations-project')
  await assertSucceeds(setDoc(reference, submissionDraft()))
  const draft = await getDoc(reference)
  const admin = verifiedUser('admin-user', { admin: true })
  await assertFails(getDoc(doc(admin, 'users', 'alice', 'submissions', 'ai-foundations-project')))
  await assertSucceeds(setDoc(reference, finalSubmission(draft.data().createdAt)))
  await assertSucceeds(getDoc(doc(admin, 'users', 'alice', 'submissions', 'ai-foundations-project')))
  await assertSucceeds(getDocs(query(collectionGroup(admin, 'submissions'), where('status', '==', 'submitted'))))
})

test('an administrator can create one immutable assignment for submitted work', async () => {
  await seedSubmittedProject('alice')
  const admin = verifiedUser('admin-user', { admin: true })
  const assignmentId = 'alice--ai-foundations-project'
  const reference = doc(admin, 'reviewAssignments', assignmentId)
  await assertSucceeds(setDoc(reference, {
    assignmentId,
    learnerUid: 'alice',
    submissionId: 'ai-foundations-project',
    reviewerUid: 'reviewer-user',
    status: 'assigned',
    assignedAt: serverTimestamp(),
    assignedBy: 'admin-user',
  }))
  await assertFails(updateDoc(reference, { reviewerUid: 'other-reviewer' }))
  await assertFails(deleteDoc(reference))
})

test('an assignment cannot name the learner or assigning administrator as reviewer', async () => {
  await seedSubmittedProject('alice')
  const admin = verifiedUser('admin-user', { admin: true })
  for (const reviewerUid of ['alice', 'admin-user']) {
    const assignmentId = 'alice--ai-foundations-project'
    await assertFails(setDoc(doc(admin, 'reviewAssignments', assignmentId), {
      assignmentId,
      learnerUid: 'alice',
      submissionId: 'ai-foundations-project',
      reviewerUid,
      status: 'assigned',
      assignedAt: serverTimestamp(),
      assignedBy: 'admin-user',
    }))
  }
})

test('a reviewer can see only their assignment and its submitted project', async () => {
  await seedSubmittedProject('alice', 'reviewer-user')
  const reviewer = verifiedUser('reviewer-user', { reviewer: true })
  const other = verifiedUser('other-reviewer', { reviewer: true })
  const assignmentId = 'alice--ai-foundations-project'
  await assertSucceeds(getDoc(doc(reviewer, 'reviewAssignments', assignmentId)))
  await assertFails(getDoc(doc(other, 'reviewAssignments', assignmentId)))
  await assertSucceeds(getDocs(query(collection(reviewer, 'reviewAssignments'), where('reviewerUid', '==', 'reviewer-user'))))
  await assertFails(getDocs(collection(reviewer, 'reviewAssignments')))
  await assertSucceeds(getDoc(doc(reviewer, 'users', 'alice', 'submissions', 'ai-foundations-project')))
  await assertFails(getDoc(doc(other, 'users', 'alice', 'submissions', 'ai-foundations-project')))
})


function rubricScores(overrides = {}) {
  return {
    localProblem: 2,
    usefulSolution: 2,
    evidence: 2,
    safetyResponsibility: 2,
    explanationReflection: 2,
    ...overrides,
  }
}

function privateReviewResult(submissionSubmittedAt, overrides = {}) {
  return {
    assignmentId: 'alice--ai-foundations-project',
    learnerUid: 'alice',
    submissionId: 'ai-foundations-project',
    reviewerUid: 'reviewer-user',
    rubricVersion: 1,
    courseVersion: 1,
    assessmentVersion: 1,
    submissionSubmittedAt,
    scores: rubricScores(),
    totalScore: 10,
    decision: 'approved',
    publicFeedback: 'Your project identifies a clear local need, explains a useful response, and reflects responsibly on evidence and limits.',
    concern: 'none',
    privateNote: 'Evidence and disclosure were checked against the submitted record.',
    reviewedAt: serverTimestamp(),
    ...overrides,
  }
}

function publicReviewResult(submissionSubmittedAt, overrides = {}) {
  return {
    assignmentId: 'alice--ai-foundations-project',
    learnerUid: 'alice',
    submissionId: 'ai-foundations-project',
    rubricVersion: 1,
    courseVersion: 1,
    assessmentVersion: 1,
    submissionSubmittedAt,
    scores: rubricScores(),
    totalScore: 10,
    decision: 'approved',
    publicFeedback: 'Your project identifies a clear local need, explains a useful response, and reflects responsibly on evidence and limits.',
    reviewedAt: serverTimestamp(),
    ...overrides,
  }
}

function addReviewPair(batch, db, submissionSubmittedAt, privateOverrides = {}, publicOverrides = {}) {
  const resultId = 'alice--ai-foundations-project'
  batch.set(doc(db, 'reviewResults', resultId), privateReviewResult(submissionSubmittedAt, privateOverrides))
  batch.set(doc(db, 'users', 'alice', 'reviewResults', resultId), publicReviewResult(submissionSubmittedAt, publicOverrides))
}

async function assignedSubmissionTime(db) {
  const snapshot = await getDoc(doc(db, 'users', 'alice', 'submissions', 'ai-foundations-project'))
  return snapshot.data().submittedAt
}

test('an assigned reviewer atomically creates one private result and learner-safe result', async () => {
  await seedSubmittedProject('alice', 'reviewer-user')
  const reviewer = verifiedUser('reviewer-user', { reviewer: true })
  const submittedAt = await assignedSubmissionTime(reviewer)
  const emptyResult = await assertSucceeds(getDoc(doc(reviewer, 'reviewResults', 'alice--ai-foundations-project')))
  assert.equal(emptyResult.exists(), false)
  const batch = writeBatch(reviewer)
  addReviewPair(batch, reviewer, submittedAt)
  await assertSucceeds(batch.commit())

  const privateResult = await assertSucceeds(getDoc(doc(reviewer, 'reviewResults', 'alice--ai-foundations-project')))
  assert.equal(privateResult.data().privateNote.length > 0, true)
  const learner = verifiedUser('alice')
  const publicResult = await assertSucceeds(getDoc(doc(learner, 'users', 'alice', 'reviewResults', 'alice--ai-foundations-project')))
  assert.equal(publicResult.data().decision, 'approved')
  assert.equal('privateNote' in publicResult.data(), false)
  assert.equal('concern' in publicResult.data(), false)
  assert.equal('reviewerUid' in publicResult.data(), false)
  await assertFails(getDoc(doc(learner, 'reviewResults', 'alice--ai-foundations-project')))
})

test('a review result requires matching private and learner-safe records in one batch', async () => {
  await seedSubmittedProject('alice', 'reviewer-user')
  const reviewer = verifiedUser('reviewer-user', { reviewer: true })
  const submittedAt = await assignedSubmissionTime(reviewer)
  await assertFails(setDoc(doc(reviewer, 'reviewResults', 'alice--ai-foundations-project'), privateReviewResult(submittedAt)))
  await assertFails(setDoc(doc(reviewer, 'users', 'alice', 'reviewResults', 'alice--ai-foundations-project'), publicReviewResult(submittedAt)))

  const mismatched = writeBatch(reviewer)
  addReviewPair(mismatched, reviewer, submittedAt, {}, { totalScore: 9 })
  await assertFails(mismatched.commit())
})

test('rubric rules reject score tampering and inconsistent decisions', async () => {
  await seedSubmittedProject('alice', 'reviewer-user')
  const reviewer = verifiedUser('reviewer-user', { reviewer: true })
  const submittedAt = await assignedSubmissionTime(reviewer)

  async function reject(privateOverrides, publicOverrides) {
    const batch = writeBatch(reviewer)
    addReviewPair(batch, reviewer, submittedAt, privateOverrides, publicOverrides)
    await assertFails(batch.commit())
  }

  await reject({ scores: rubricScores({ evidence: 3 }), totalScore: 11 }, { scores: rubricScores({ evidence: 3 }), totalScore: 11 })
  await reject({ totalScore: 9 }, { totalScore: 9 })
  const lowScores = rubricScores({ localProblem: 1, usefulSolution: 1, evidence: 1 })
  await reject({ scores: lowScores, totalScore: 7 }, { scores: lowScores, totalScore: 7 })
  const unsafeScores = rubricScores({ safetyResponsibility: 0 })
  await reject({ scores: unsafeScores, totalScore: 8 }, { scores: unsafeScores, totalScore: 8 })
  await reject({ concern: 'plagiarism' }, {})
  await reject({ concern: 'identity', decision: 'revision_requested', privateNote: '' }, { decision: 'revision_requested' })
  await reject({ decision: 'revision_requested' }, { decision: 'revision_requested' })
})

test('one revision-request result is valid and cannot be changed or deleted', async () => {
  await seedSubmittedProject('alice', 'reviewer-user')
  const reviewer = verifiedUser('reviewer-user', { reviewer: true })
  const submittedAt = await assignedSubmissionTime(reviewer)
  const scores = rubricScores({ safetyResponsibility: 0 })
  const batch = writeBatch(reviewer)
  addReviewPair(batch, reviewer, submittedAt, {
    scores,
    totalScore: 8,
    decision: 'revision_requested',
    publicFeedback: 'Please revise the project to explain how personal information is protected and how unsafe answers will be handled.',
    concern: 'safeguarding',
  }, {
    scores,
    totalScore: 8,
    decision: 'revision_requested',
    publicFeedback: 'Please revise the project to explain how personal information is protected and how unsafe answers will be handled.',
  })
  await assertSucceeds(batch.commit())

  const privateReference = doc(reviewer, 'reviewResults', 'alice--ai-foundations-project')
  const publicReference = doc(reviewer, 'users', 'alice', 'reviewResults', 'alice--ai-foundations-project')
  await assertFails(updateDoc(privateReference, { decision: 'approved' }))
  await assertFails(updateDoc(publicReference, { decision: 'approved' }))
  await assertFails(deleteDoc(privateReference))
  await assertFails(deleteDoc(publicReference))
})

test('learners, unrelated reviewers, and administrators cannot write review results', async () => {
  await seedSubmittedProject('alice', 'reviewer-user')
  const assigned = verifiedUser('reviewer-user', { reviewer: true })
  const submittedAt = await assignedSubmissionTime(assigned)
  for (const db of [verifiedUser('alice'), verifiedUser('other-reviewer', { reviewer: true }), verifiedUser('admin-user', { admin: true })]) {
    const batch = writeBatch(db)
    addReviewPair(batch, db, submittedAt)
    await assertFails(batch.commit())
  }
})

test('private review fields stay isolated from learners and unrelated reviewers', async () => {
  await seedSubmittedProject('alice', 'reviewer-user')
  const reviewer = verifiedUser('reviewer-user', { reviewer: true })
  const submittedAt = await assignedSubmissionTime(reviewer)
  const batch = writeBatch(reviewer)
  addReviewPair(batch, reviewer, submittedAt)
  await assertSucceeds(batch.commit())

  const other = verifiedUser('other-reviewer', { reviewer: true })
  await assertFails(getDoc(doc(other, 'reviewResults', 'alice--ai-foundations-project')))
  await assertFails(getDoc(doc(other, 'users', 'alice', 'reviewResults', 'alice--ai-foundations-project')))
  const admin = verifiedUser('admin-user', { admin: true })
  await assertSucceeds(getDoc(doc(admin, 'reviewResults', 'alice--ai-foundations-project')))
  await assertSucceeds(getDoc(doc(admin, 'users', 'alice', 'reviewResults', 'alice--ai-foundations-project')))
})

test('an approved review does not grant certificate-writing authority', async () => {
  await seedSubmittedProject('alice', 'reviewer-user')
  const reviewer = verifiedUser('reviewer-user', { reviewer: true })
  const submittedAt = await assignedSubmissionTime(reviewer)
  const batch = writeBatch(reviewer)
  addReviewPair(batch, reviewer, submittedAt)
  await assertSucceeds(batch.commit())

  for (const db of [verifiedUser('alice'), reviewer, verifiedUser('admin-user', { admin: true })]) {
    await assertFails(setDoc(doc(db, 'certificates', 'EFBI-NOT-YET-001'), {
      credentialId: 'EFBI-NOT-YET-001',
      learnerName: 'Alice Learner',
      courseId: 'ai-foundations',
      courseTitle: 'AI Foundations for Ethiopia',
      issuedAt: serverTimestamp(),
      status: 'active',
      public: true,
      updatedAt: serverTimestamp(),
    }))
  }
})


function revisionDraft(overrides = {}) {
  return submissionDraft({
    submissionId: 'ai-foundations-project-revision-1',
    originalSubmissionId: 'ai-foundations-project',
    revisionNumber: 1,
    basedOnReviewId: 'alice--ai-foundations-project',
    originalSubmittedAt: new Date('2026-09-12T00:10:00Z'),
    basedOnReviewReviewedAt: new Date('2026-09-12T00:20:00Z'),
    ...overrides,
  })
}

function finalRevision(createdAt, overrides = {}) {
  return revisionDraft({
    createdAt,
    consentVersion: 'efbi-project-revision-consent-v1',
    consentAcceptedAt: serverTimestamp(),
    status: 'submitted',
    updatedAt: serverTimestamp(),
    submittedAt: serverTimestamp(),
    ...overrides,
  })
}

async function seedRevisionRequested(uid = 'alice') {
  await seedSubmittedProject(uid, 'reviewer-user')
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    const assignmentId = uid + '--ai-foundations-project'
    const submittedAt = new Date('2026-09-12T00:10:00Z')
    const reviewedAt = new Date('2026-09-12T00:20:00Z')
    const scores = rubricScores({ safetyResponsibility: 0 })
    const shared = {
      assignmentId,
      learnerUid: uid,
      submissionId: 'ai-foundations-project',
      rubricVersion: 1,
      courseVersion: 1,
      assessmentVersion: 1,
      submissionSubmittedAt: submittedAt,
      scores,
      totalScore: 8,
      decision: 'revision_requested',
      publicFeedback: 'Please revise the project to explain how personal information is protected and how unsafe answers will be handled.',
      reviewedAt,
    }
    await setDoc(doc(db, 'reviewResults', assignmentId), {
      ...shared,
      reviewerUid: 'reviewer-user',
      concern: 'safeguarding',
      privateNote: 'The project needs a clearer privacy and safeguarding boundary.',
    })
    await setDoc(doc(db, 'users', uid, 'reviewResults', assignmentId), shared)
  })
}

function privateRevisionReviewResult(submissionSubmittedAt, overrides = {}) {
  return {
    assignmentId: 'alice--ai-foundations-project-revision-1',
    learnerUid: 'alice',
    submissionId: 'ai-foundations-project-revision-1',
    reviewerUid: 'revision-reviewer',
    rubricVersion: 1,
    courseVersion: 1,
    assessmentVersion: 1,
    submissionSubmittedAt,
    scores: rubricScores(),
    totalScore: 10,
    decision: 'approved',
    publicFeedback: 'Your revision now explains the privacy boundary, shows appropriate evidence, and responds clearly to the first review.',
    concern: 'none',
    privateNote: 'Compared the revision with the preserved original and first review.',
    reviewedAt: serverTimestamp(),
    ...overrides,
  }
}

function publicRevisionReviewResult(submissionSubmittedAt, overrides = {}) {
  const privateResult = privateRevisionReviewResult(submissionSubmittedAt, overrides)
  const { reviewerUid, concern, privateNote, ...safeResult } = privateResult
  void reviewerUid; void concern; void privateNote
  return safeResult
}

async function seedSubmittedRevision(uid = 'alice') {
  await seedRevisionRequested(uid)
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users', uid, 'submissions', 'ai-foundations-project-revision-1'), {
      ...revisionDraft({ basedOnReviewId: uid + '--ai-foundations-project' }),
      createdAt: new Date('2026-09-12T00:30:00Z'),
      updatedAt: new Date('2026-09-12T00:40:00Z'),
      consentVersion: 'efbi-project-revision-consent-v1',
      consentAcceptedAt: new Date('2026-09-12T00:40:00Z'),
      status: 'submitted',
      submittedAt: new Date('2026-09-12T00:40:00Z'),
    })
  })
}

test('a learner cannot open a revision before a revision-request result exists', async () => {
  await seedSubmittedProject('alice')
  const learner = verifiedUser('alice')
  await assertFails(setDoc(doc(learner, 'users', 'alice', 'submissions', 'ai-foundations-project-revision-1'), revisionDraft()))
})

test('a revision-request result unlocks one private revision draft', async () => {
  await seedRevisionRequested()
  const learner = verifiedUser('alice')
  const reference = doc(learner, 'users', 'alice', 'submissions', 'ai-foundations-project-revision-1')
  await assertSucceeds(setDoc(reference, revisionDraft()))
  const saved = await assertSucceeds(getDoc(reference))
  await assertSucceeds(setDoc(reference, revisionDraft({
    createdAt: saved.data().createdAt,
    solutionSummary: 'A revised question-and-answer guide with a clear privacy boundary, reviewed sources, and safe escalation to a teacher.',
  })))
  await assertFails(getDoc(doc(verifiedUser('bob'), 'users', 'alice', 'submissions', 'ai-foundations-project-revision-1')))
})

test('revision provenance, identifier, and schema cannot be forged', async () => {
  await seedRevisionRequested()
  const learner = verifiedUser('alice')
  const path = (...segments) => doc(learner, ...segments)
  await assertFails(setDoc(path('users', 'alice', 'submissions', 'ai-foundations-project-revision-1'), revisionDraft({ originalSubmissionId: 'another-project' })))
  await assertFails(setDoc(path('users', 'alice', 'submissions', 'ai-foundations-project-revision-1'), revisionDraft({ basedOnReviewId: 'alice--forged-review' })))
  await assertFails(setDoc(path('users', 'alice', 'submissions', 'ai-foundations-project-revision-1'), revisionDraft({ revisionNumber: 2 })))
  await assertFails(setDoc(path('users', 'alice', 'submissions', 'ai-foundations-project-revision-1'), revisionDraft({ courseVersion: 2 })))
  await assertFails(setDoc(path('users', 'alice', 'submissions', 'ai-foundations-project-revision-1'), revisionDraft({ originalSubmittedAt: new Date('2026-09-12T00:11:00Z') })))
  await assertFails(setDoc(path('users', 'alice', 'submissions', 'ai-foundations-project-revision-1'), revisionDraft({ basedOnReviewReviewedAt: new Date('2026-09-12T00:21:00Z') })))
  await assertFails(setDoc(path('users', 'alice', 'submissions', 'ai-foundations-project-revision-1'), revisionDraft({ unexpectedField: true })))
  await assertFails(setDoc(path('users', 'alice', 'submissions', 'ai-foundations-project-revision-2'), revisionDraft({ submissionId: 'ai-foundations-project-revision-2', revisionNumber: 2 })))
})

test('the one revision requires new consent and becomes immutable', async () => {
  await seedRevisionRequested()
  const learner = verifiedUser('alice')
  const reference = doc(learner, 'users', 'alice', 'submissions', 'ai-foundations-project-revision-1')
  await assertSucceeds(setDoc(reference, revisionDraft()))
  const draft = await getDoc(reference)
  await assertFails(setDoc(reference, revisionDraft({ createdAt: draft.data().createdAt, status: 'submitted' })))
  await assertFails(setDoc(reference, finalRevision(draft.data().createdAt, { consentVersion: 'efbi-project-consent-v1' })))
  await assertSucceeds(setDoc(reference, finalRevision(draft.data().createdAt)))
  const submitted = await getDoc(reference)
  await assertFails(setDoc(reference, finalRevision(submitted.data().createdAt, { projectTitle: 'Changed after revision submission' })))
  await assertFails(deleteDoc(reference))
})

test('administrators see only a submitted revision and can assign it separately', async () => {
  await seedRevisionRequested()
  const learner = verifiedUser('alice')
  const admin = verifiedUser('admin-user', { admin: true })
  const revisionReference = doc(learner, 'users', 'alice', 'submissions', 'ai-foundations-project-revision-1')
  await assertSucceeds(setDoc(revisionReference, revisionDraft()))
  await assertFails(getDoc(doc(admin, 'users', 'alice', 'submissions', 'ai-foundations-project-revision-1')))
  await assertFails(setDoc(doc(admin, 'reviewAssignments', 'alice--ai-foundations-project-revision-1'), {
    assignmentId: 'alice--ai-foundations-project-revision-1', learnerUid: 'alice', submissionId: 'ai-foundations-project-revision-1',
    reviewerUid: 'revision-reviewer', status: 'assigned', assignedAt: serverTimestamp(), assignedBy: 'admin-user',
  }))
  const draft = await getDoc(revisionReference)
  await assertSucceeds(setDoc(revisionReference, finalRevision(draft.data().createdAt)))
  await assertSucceeds(getDoc(doc(admin, 'users', 'alice', 'submissions', 'ai-foundations-project-revision-1')))
  await assertSucceeds(setDoc(doc(admin, 'reviewAssignments', 'alice--ai-foundations-project-revision-1'), {
    assignmentId: 'alice--ai-foundations-project-revision-1', learnerUid: 'alice', submissionId: 'ai-foundations-project-revision-1',
    reviewerUid: 'revision-reviewer', status: 'assigned', assignedAt: serverTimestamp(), assignedBy: 'admin-user',
  }))
})

test('the assigned revision reviewer alone can read and review Version 2', async () => {
  await seedSubmittedRevision()
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'reviewAssignments', 'alice--ai-foundations-project-revision-1'), {
      assignmentId: 'alice--ai-foundations-project-revision-1', learnerUid: 'alice', submissionId: 'ai-foundations-project-revision-1',
      reviewerUid: 'revision-reviewer', status: 'assigned', assignedAt: new Date('2026-09-12T00:45:00Z'), assignedBy: 'admin-user',
    })
  })
  const reviewer = verifiedUser('revision-reviewer', { reviewer: true })
  const other = verifiedUser('other-reviewer', { reviewer: true })
  const revisionReference = doc(reviewer, 'users', 'alice', 'submissions', 'ai-foundations-project-revision-1')
  await assertSucceeds(getDoc(revisionReference))
  await assertFails(getDoc(doc(other, 'users', 'alice', 'submissions', 'ai-foundations-project-revision-1')))
  const submittedAt = (await getDoc(revisionReference)).data().submittedAt
  const batch = writeBatch(reviewer)
  batch.set(doc(reviewer, 'reviewResults', 'alice--ai-foundations-project-revision-1'), privateRevisionReviewResult(submittedAt))
  batch.set(doc(reviewer, 'users', 'alice', 'reviewResults', 'alice--ai-foundations-project-revision-1'), publicRevisionReviewResult(submittedAt))
  await assertSucceeds(batch.commit())
  const safeResult = await assertSucceeds(getDoc(doc(verifiedUser('alice'), 'users', 'alice', 'reviewResults', 'alice--ai-foundations-project-revision-1')))
  assert.equal(safeResult.data().decision, 'approved')
  assert.equal('privateNote' in safeResult.data(), false)
  assert.equal('reviewerUid' in safeResult.data(), false)
})

test('a second requested result never unlocks a third submission version', async () => {
  await seedSubmittedRevision()
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users', 'alice', 'reviewResults', 'alice--ai-foundations-project-revision-1'), {
      ...publicRevisionReviewResult(new Date('2026-09-12T00:40:00Z'), {
        decision: 'revision_requested', scores: rubricScores({ safetyResponsibility: 0 }), totalScore: 8,
      }),
      reviewedAt: new Date('2026-09-12T00:50:00Z'),
    })
  })
  const learner = verifiedUser('alice')
  await assertFails(setDoc(doc(learner, 'users', 'alice', 'submissions', 'ai-foundations-project-revision-2'), revisionDraft({
    submissionId: 'ai-foundations-project-revision-2', revisionNumber: 2,
  })))
})


const certificateIdOne = 'EFBI-2026-ABCD2345EFGH'
const certificateIdTwo = 'EFBI-2026-JKLM6789NPQR'
const certificateClaimId = 'alice--ai-foundations'

async function seedApprovedCertificateReview() {
  await seedSubmittedProject('alice')
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    const submittedAt = new Date('2026-09-12T00:10:00Z')
    const reviewedAt = new Date('2026-09-12T01:00:00Z')
    await setDoc(doc(db, 'users', 'alice', 'reviewResults', 'alice--ai-foundations-project'), {
      ...publicReviewResult(submittedAt),
      reviewedAt,
    })
  })
}

function certificateRequest(reviewedAt, overrides = {}) {
  return {
    requestId: 'ai-foundations',
    learnerUid: 'alice',
    courseId: 'ai-foundations',
    publicName: 'Alice Learner',
    consentVersion: 'efbi-certificate-public-v1',
    consentAcceptedAt: serverTimestamp(),
    finalReviewId: 'alice--ai-foundations-project',
    submissionId: 'ai-foundations-project',
    courseVersion: 1,
    assessmentVersion: 1,
    reviewedAt,
    status: 'requested',
    createdAt: serverTimestamp(),
    ...overrides,
  }
}

async function seedCertificateRequest() {
  await seedApprovedCertificateReview()
  const learner = verifiedUser('alice')
  const result = await getDoc(doc(learner, 'users', 'alice', 'reviewResults', 'alice--ai-foundations-project'))
  await assertSucceeds(setDoc(
    doc(learner, 'users', 'alice', 'certificateRequests', 'ai-foundations'),
    certificateRequest(result.data().reviewedAt),
  ))
  return result.data().reviewedAt
}

function certificateIssuance(credentialId, reviewedAt, auditId, replacesCredentialId = '') {
  return {
    credentialId,
    claimId: certificateClaimId,
    learnerUid: 'alice',
    publicName: 'Alice Learner',
    courseId: 'ai-foundations',
    courseTitle: 'AI Foundations for Ethiopia',
    finalReviewId: 'alice--ai-foundations-project',
    submissionId: 'ai-foundations-project',
    courseVersion: 1,
    assessmentVersion: 1,
    reviewedAt,
    issuedAt: serverTimestamp(),
    issuedBy: 'admin-user',
    auditId,
    replacesCredentialId,
  }
}

function publicCertificate(credentialId, replacesCredentialId = '') {
  return {
    credentialId,
    publicName: 'Alice Learner',
    courseId: 'ai-foundations',
    courseTitle: 'AI Foundations for Ethiopia',
    issuedAt: serverTimestamp(),
    replacesCredentialId,
  }
}

function certificateStatus(credentialId, auditId) {
  return {
    credentialId,
    status: 'active',
    updatedAt: serverTimestamp(),
    replacedBy: '',
    lastAuditId: auditId,
  }
}

function certificateAudit(eventId, action, credentialId, replacementCredentialId = '', reason = 'Approved review and learner consent confirmed.') {
  return {
    eventId,
    action,
    credentialId,
    replacementCredentialId,
    learnerUid: 'alice',
    actorUid: 'admin-user',
    reason,
    createdAt: serverTimestamp(),
  }
}

function addInitialCertificatePackage(batch, db, reviewedAt, credentialId = certificateIdOne, auditId = 'certificate-issued-audit-0001') {
  batch.set(doc(db, 'certificateIssuances', credentialId), certificateIssuance(credentialId, reviewedAt, auditId))
  batch.set(doc(db, 'certificates', credentialId), publicCertificate(credentialId))
  batch.set(doc(db, 'certificateStatuses', credentialId), certificateStatus(credentialId, auditId))
  batch.set(doc(db, 'certificateClaims', certificateClaimId), {
    claimId: certificateClaimId,
    learnerUid: 'alice',
    courseId: 'ai-foundations',
    currentCredentialId: credentialId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastAuditId: auditId,
  })
  batch.set(doc(db, 'certificateAudit', auditId), certificateAudit(auditId, 'certificate.issued', credentialId))
}

async function issueInitialCertificate() {
  const reviewedAt = await seedCertificateRequest()
  const admin = verifiedUser('admin-user', { admin: true })
  const batch = writeBatch(admin)
  addInitialCertificatePackage(batch, admin, reviewedAt)
  await assertSucceeds(batch.commit())
  return admin
}

test('only an approved learner can create one immutable public-name certificate request', async () => {
  await seedSubmittedProject('alice')
  const learner = verifiedUser('alice')
  const requestRef = doc(learner, 'users', 'alice', 'certificateRequests', 'ai-foundations')
  await assertFails(setDoc(requestRef, certificateRequest(new Date('2026-09-12T01:00:00Z'))))

  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users', 'alice', 'reviewResults', 'alice--ai-foundations-project'), {
      ...publicReviewResult(new Date('2026-09-12T00:10:00Z')),
      reviewedAt: new Date('2026-09-12T01:00:00Z'),
    })
  })
  const result = await getDoc(doc(learner, 'users', 'alice', 'reviewResults', 'alice--ai-foundations-project'))
  await assertFails(setDoc(requestRef, certificateRequest(result.data().reviewedAt, { publicName: 'A' })))
  await assertSucceeds(setDoc(requestRef, certificateRequest(result.data().reviewedAt)))
  await assertFails(updateDoc(requestRef, { publicName: 'Changed Name' }))
  await assertFails(deleteDoc(requestRef))
})

test('certificate requests and claims remain scoped to the learner and administrators', async () => {
  await seedCertificateRequest()
  const learner = verifiedUser('alice')
  const other = verifiedUser('bob')
  const reviewer = verifiedUser('reviewer-user', { reviewer: true })
  const admin = verifiedUser('admin-user', { admin: true })
  const requestPath = ['users', 'alice', 'certificateRequests', 'ai-foundations']
  await assertSucceeds(getDoc(doc(learner, ...requestPath)))
  await assertSucceeds(getDoc(doc(admin, ...requestPath)))
  await assertFails(getDoc(doc(other, ...requestPath)))
  await assertFails(getDoc(doc(reviewer, ...requestPath)))
  await assertFails(getDoc(doc(other, 'certificateClaims', certificateClaimId)))
})

test('an administrator can issue only the complete atomic certificate package', async () => {
  const reviewedAt = await seedCertificateRequest()
  const admin = verifiedUser('admin-user', { admin: true })
  const partial = writeBatch(admin)
  partial.set(doc(admin, 'certificateIssuances', certificateIdOne), certificateIssuance(certificateIdOne, reviewedAt, 'certificate-issued-partial-0001'))
  await assertFails(partial.commit())

  const complete = writeBatch(admin)
  addInitialCertificatePackage(complete, admin, reviewedAt)
  await assertSucceeds(complete.commit())
  const issuance = await getDoc(doc(admin, 'certificateIssuances', certificateIdOne))
  assert.equal(issuance.data().publicName, 'Alice Learner')
})

test('learners and reviewers cannot issue credentials even with a valid request', async () => {
  const reviewedAt = await seedCertificateRequest()
  for (const db of [verifiedUser('alice'), verifiedUser('reviewer-user', { reviewer: true })]) {
    const batch = writeBatch(db)
    addInitialCertificatePackage(batch, db, reviewedAt)
    await assertFails(batch.commit())
  }
})

function addReplacementCertificatePackage(batch, db, reviewedAt, auditId = 'certificate-replaced-audit-0002') {
  batch.set(doc(db, 'certificateIssuances', certificateIdTwo), certificateIssuance(certificateIdTwo, reviewedAt, auditId, certificateIdOne))
  batch.set(doc(db, 'certificates', certificateIdTwo), publicCertificate(certificateIdTwo, certificateIdOne))
  batch.set(doc(db, 'certificateStatuses', certificateIdTwo), certificateStatus(certificateIdTwo, auditId))
  batch.update(doc(db, 'certificateClaims', certificateClaimId), {
    currentCredentialId: certificateIdTwo,
    updatedAt: serverTimestamp(),
    lastAuditId: auditId,
  })
  batch.update(doc(db, 'certificateStatuses', certificateIdOne), {
    status: 'replaced',
    updatedAt: serverTimestamp(),
    replacedBy: certificateIdTwo,
    lastAuditId: auditId,
  })
  batch.set(doc(db, 'certificateAudit', auditId), certificateAudit(
    auditId,
    'certificate.replaced',
    certificateIdOne,
    certificateIdTwo,
    'The public credential needed a corrected replacement.',
  ))
}

async function revokeInitialCertificate(admin) {
  const auditId = 'certificate-revoked-audit-0002'
  const batch = writeBatch(admin)
  batch.update(doc(admin, 'certificateStatuses', certificateIdOne), {
    status: 'revoked',
    updatedAt: serverTimestamp(),
    replacedBy: '',
    lastAuditId: auditId,
  })
  batch.set(doc(admin, 'certificateAudit', auditId), certificateAudit(
    auditId,
    'certificate.revoked',
    certificateIdOne,
    '',
    'The credential must no longer be treated as valid.',
  ))
  await assertSucceeds(batch.commit())
}

test('public verification exposes only the approved certificate core and current status', async () => {
  await issueInitialCertificate()
  const visitor = environment.unauthenticatedContext().firestore()
  const publicRecord = await assertSucceeds(getDoc(doc(visitor, 'certificates', certificateIdOne)))
  const statusRecord = await assertSucceeds(getDoc(doc(visitor, 'certificateStatuses', certificateIdOne)))
  assert.deepEqual(
    Object.keys(publicRecord.data()).sort(),
    ['courseId', 'courseTitle', 'credentialId', 'issuedAt', 'publicName', 'replacesCredentialId'].sort(),
  )
  assert.equal(statusRecord.data().status, 'active')
  for (const field of ['learnerUid', 'email', 'scores', 'reviewerUid', 'privateNote', 'issuedBy']) {
    assert.equal(field in publicRecord.data(), false)
  }
  await assertFails(getDoc(doc(visitor, 'certificateIssuances', certificateIdOne)))
  await assertFails(getDoc(doc(visitor, 'certificateAudit', 'certificate-issued-audit-0001')))
  await assertFails(getDocs(collection(visitor, 'certificates')))
  await assertFails(getDocs(collection(visitor, 'certificateStatuses')))
})

test('one course claim prevents a second initial credential', async () => {
  const admin = await issueInitialCertificate()
  const request = await getDoc(doc(admin, 'users', 'alice', 'certificateRequests', 'ai-foundations'))
  const duplicate = writeBatch(admin)
  addInitialCertificatePackage(duplicate, admin, request.data().reviewedAt, certificateIdTwo, 'certificate-duplicate-audit-0002')
  await assertFails(duplicate.commit())
  assert.equal((await getDoc(doc(admin, 'certificateClaims', certificateClaimId))).data().currentCredentialId, certificateIdOne)
})

test('revocation requires one atomic status change and private audit record', async () => {
  const admin = await issueInitialCertificate()
  await assertFails(updateDoc(doc(admin, 'certificateStatuses', certificateIdOne), {
    status: 'revoked',
    updatedAt: serverTimestamp(),
    replacedBy: '',
    lastAuditId: 'certificate-revoked-orphan-0002',
  }))
  await revokeInitialCertificate(admin)
  assert.equal((await getDoc(doc(admin, 'certificateStatuses', certificateIdOne))).data().status, 'revoked')
  assert.equal((await getDoc(doc(admin, 'certificateIssuances', certificateIdOne))).data().credentialId, certificateIdOne)
  await assertFails(updateDoc(doc(admin, 'certificates', certificateIdOne), { publicName: 'Changed after issue' }))
  await assertFails(deleteDoc(doc(admin, 'certificateIssuances', certificateIdOne)))
})

test('replacement atomically preserves the old record and activates one new credential', async () => {
  const admin = await issueInitialCertificate()
  const request = await getDoc(doc(admin, 'users', 'alice', 'certificateRequests', 'ai-foundations'))
  const batch = writeBatch(admin)
  addReplacementCertificatePackage(batch, admin, request.data().reviewedAt)
  await assertSucceeds(batch.commit())

  const oldStatus = await getDoc(doc(admin, 'certificateStatuses', certificateIdOne))
  const newStatus = await getDoc(doc(admin, 'certificateStatuses', certificateIdTwo))
  const claim = await getDoc(doc(admin, 'certificateClaims', certificateClaimId))
  const replacement = await getDoc(doc(admin, 'certificates', certificateIdTwo))
  assert.equal(oldStatus.data().status, 'replaced')
  assert.equal(oldStatus.data().replacedBy, certificateIdTwo)
  assert.equal(newStatus.data().status, 'active')
  assert.equal(claim.data().currentCredentialId, certificateIdTwo)
  assert.equal(replacement.data().replacesCredentialId, certificateIdOne)
  assert.equal((await getDoc(doc(admin, 'certificates', certificateIdOne))).data().credentialId, certificateIdOne)
})

test('a revoked credential cannot be reactivated or used as a replacement source', async () => {
  const admin = await issueInitialCertificate()
  await revokeInitialCertificate(admin)
  await assertFails(updateDoc(doc(admin, 'certificateStatuses', certificateIdOne), {
    status: 'active',
    updatedAt: serverTimestamp(),
    replacedBy: '',
    lastAuditId: 'certificate-reactivate-audit-0003',
  }))

  const request = await getDoc(doc(admin, 'users', 'alice', 'certificateRequests', 'ai-foundations'))
  const replacement = writeBatch(admin)
  addReplacementCertificatePackage(replacement, admin, request.data().reviewedAt, 'certificate-replace-revoked-0003')
  await assertFails(replacement.commit())
  assert.equal((await getDoc(doc(admin, 'certificateStatuses', certificateIdOne))).data().status, 'revoked')
})
function dataDeletionRequest(uid = 'alice') {
  return {
    requestId: uid,
    learnerUid: uid,
    scope: 'account-and-learning-data',
    policyVersion: 'efbi-retention-v1',
    status: 'requested',
    requestedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: null,
    certificateEvidenceRetained: false,
  }
}

function retentionAudit(eventId, action, uid = 'alice', reason = 'Documented privacy operation approved after a careful review.') {
  return { eventId, action, learnerUid: uid, actorUid: 'admin-user', reason, createdAt: serverTimestamp() }
}

function deletionCompletion(uid, auditId, certificateEvidenceRetained = false) {
  return {
    completionId: uid,
    learnerUid: uid,
    policyVersion: 'efbi-retention-v1',
    completedAt: serverTimestamp(),
    certificateEvidenceRetained,
    authenticationRemoval: 'manual-console-required',
    deletedCategories: certificateEvidenceRetained
      ? ['profile', 'courseProgress']
      : ['profile', 'courseProgress', 'projectSubmissions', 'reviewRecords', 'certificateRequest'],
    auditId,
  }
}

async function seedPrivacyRecords(uid = 'alice', withEvidence = true) {
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, 'users', uid), { displayName: 'Alice Learner', status: 'active', createdAt: new Date(), updatedAt: new Date() })
    await setDoc(doc(db, 'users', uid, 'progress', 'ai-foundations'), { courseId: 'ai-foundations' })
    if (!withEvidence) return
    await setDoc(doc(db, 'users', uid, 'certificateRequests', 'ai-foundations'), { learnerUid: uid })
    for (const submissionId of ['ai-foundations-project', 'ai-foundations-project-revision-1']) {
      const resultId = uid + '--' + submissionId
      await setDoc(doc(db, 'users', uid, 'submissions', submissionId), { learnerUid: uid, status: 'submitted' })
      await setDoc(doc(db, 'users', uid, 'reviewResults', resultId), { learnerUid: uid })
      await setDoc(doc(db, 'reviewResults', resultId), { learnerUid: uid })
      await setDoc(doc(db, 'reviewAssignments', resultId), { learnerUid: uid })
    }
  })
}

async function requestOwnDeletion(uid = 'alice') {
  const learner = verifiedUser(uid)
  await assertSucceeds(setDoc(doc(learner, 'deletionRequests', uid), dataDeletionRequest(uid)))
  return learner
}

function addDeletionCompletion(batch, db, uid = 'alice', certificateEvidenceRetained = false) {
  const auditId = 'retention-deletion-completed-' + uid + '-0001'
  batch.update(doc(db, 'deletionRequests', uid), {
    status: 'completed', updatedAt: serverTimestamp(), completedAt: serverTimestamp(), certificateEvidenceRetained,
  })
  batch.set(doc(db, 'deletionCompletions', uid), deletionCompletion(uid, auditId, certificateEvidenceRetained))
  batch.set(doc(db, 'retentionAudit', auditId), retentionAudit(
    auditId,
    'deletion.completed',
    uid,
    certificateEvidenceRetained
      ? 'Eligible learner data deleted while certificate evidence remains protected.'
      : 'Eligible learner data deleted after confirming no certificate evidence was required.',
  ))
}

test('a learner controls one deletion request and an active request freezes learning writes', async () => {
  await seedPrivacyRecords('alice', false)
  const learner = await requestOwnDeletion()
  await assertFails(updateDoc(doc(learner, 'users', 'alice'), { displayName: 'Changed Name', updatedAt: serverTimestamp() }))
  await assertFails(setDoc(doc(learner, 'users', 'alice', 'progress', 'ai-foundations'), {
    courseId: 'ai-foundations', completedLessonIds: ['understanding-ai'], lastLessonId: 'understanding-ai', percent: 25,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  }))
  await assertSucceeds(updateDoc(doc(learner, 'deletionRequests', 'alice'), { status: 'cancelled', updatedAt: serverTimestamp() }))
  await assertSucceeds(updateDoc(doc(learner, 'users', 'alice'), { displayName: 'Changed Name', updatedAt: serverTimestamp() }))
  await assertSucceeds(updateDoc(doc(learner, 'deletionRequests', 'alice'), { status: 'requested', updatedAt: serverTimestamp() }))
  await assertFails(updateDoc(doc(learner, 'deletionRequests', 'alice'), { status: 'completed', updatedAt: serverTimestamp() }))
  await assertFails(setDoc(doc(verifiedUser('bob'), 'deletionRequests', 'alice'), dataDeletionRequest('alice')))
})

test('retention holds are private and require one atomic request and audit transition', async () => {
  const learner = await requestOwnDeletion()
  const admin = verifiedUser('admin-user', { admin: true })
  const holdId = 'retention-hold-created-alice-0001'
  await assertFails(updateDoc(doc(admin, 'deletionRequests', 'alice'), { status: 'held', updatedAt: serverTimestamp() }))
  const holdBatch = writeBatch(admin)
  holdBatch.set(doc(admin, 'retentionHolds', 'alice'), {
    holdId: 'alice', learnerUid: 'alice', status: 'active', reason: 'A documented certificate-integrity investigation is still open.',
    createdAt: serverTimestamp(), createdBy: 'admin-user', updatedAt: serverTimestamp(), updatedBy: 'admin-user', auditId: holdId,
  })
  holdBatch.update(doc(admin, 'deletionRequests', 'alice'), { status: 'held', updatedAt: serverTimestamp() })
  holdBatch.set(doc(admin, 'retentionAudit', holdId), retentionAudit(holdId, 'retention.hold.created'))
  await assertSucceeds(holdBatch.commit())
  await assertFails(getDoc(doc(learner, 'retentionHolds', 'alice')))
  assert.equal((await getDoc(doc(learner, 'deletionRequests', 'alice'))).data().status, 'held')

  const releaseId = 'retention-hold-released-alice-0002'
  const releaseBatch = writeBatch(admin)
  releaseBatch.update(doc(admin, 'retentionHolds', 'alice'), {
    status: 'released', reason: 'The investigation closed and the evidence restriction is no longer needed.',
    updatedAt: serverTimestamp(), updatedBy: 'admin-user', auditId: releaseId,
  })
  releaseBatch.update(doc(admin, 'deletionRequests', 'alice'), { status: 'requested', updatedAt: serverTimestamp() })
  releaseBatch.set(doc(admin, 'retentionAudit', releaseId), retentionAudit(releaseId, 'retention.hold.released'))
  await assertSucceeds(releaseBatch.commit())
  await assertFails(updateDoc(doc(admin, 'retentionAudit', releaseId), { reason: 'Changed later without permission.' }))
})

test('deletion without a certificate removes every eligible fixed record in one audited batch', async () => {
  await seedPrivacyRecords()
  const learner = await requestOwnDeletion()
  const admin = verifiedUser('admin-user', { admin: true })
  const batch = writeBatch(admin)
  batch.delete(doc(admin, 'users', 'alice'))
  batch.delete(doc(admin, 'users', 'alice', 'progress', 'ai-foundations'))
  batch.delete(doc(admin, 'users', 'alice', 'certificateRequests', 'ai-foundations'))
  for (const submissionId of ['ai-foundations-project', 'ai-foundations-project-revision-1']) {
    const resultId = 'alice--' + submissionId
    batch.delete(doc(admin, 'users', 'alice', 'submissions', submissionId))
    batch.delete(doc(admin, 'users', 'alice', 'reviewResults', resultId))
    batch.delete(doc(admin, 'reviewResults', resultId))
    batch.delete(doc(admin, 'reviewAssignments', resultId))
  }
  addDeletionCompletion(batch, admin)
  await assertSucceeds(batch.commit())
  assert.equal((await getDoc(doc(learner, 'deletionRequests', 'alice'))).data().status, 'completed')
  const completion = await getDoc(doc(learner, 'deletionCompletions', 'alice'))
  assert.equal(completion.data().authenticationRemoval, 'manual-console-required')
  assert.equal(completion.data().certificateEvidenceRetained, false)
  await assertFails(getDoc(doc(learner, 'retentionAudit', completion.data().auditId)))
  assert.equal((await getDoc(doc(admin, 'users', 'alice'))).exists(), false)
})

test('partial deletion and deletion during an active hold are rejected without a completion record', async () => {
  await seedPrivacyRecords('alice', false)
  await requestOwnDeletion()
  const admin = verifiedUser('admin-user', { admin: true })
  const partial = writeBatch(admin)
  partial.delete(doc(admin, 'users', 'alice'))
  addDeletionCompletion(partial, admin)
  await assertFails(partial.commit())

  const holdId = 'retention-hold-created-alice-0003'
  const holdBatch = writeBatch(admin)
  holdBatch.set(doc(admin, 'retentionHolds', 'alice'), {
    holdId: 'alice', learnerUid: 'alice', status: 'active', reason: 'A documented safety investigation requires a temporary processing hold.',
    createdAt: serverTimestamp(), createdBy: 'admin-user', updatedAt: serverTimestamp(), updatedBy: 'admin-user', auditId: holdId,
  })
  holdBatch.update(doc(admin, 'deletionRequests', 'alice'), { status: 'held', updatedAt: serverTimestamp() })
  holdBatch.set(doc(admin, 'retentionAudit', holdId), retentionAudit(holdId, 'retention.hold.created'))
  await assertSucceeds(holdBatch.commit())
  const blocked = writeBatch(admin)
  blocked.delete(doc(admin, 'users', 'alice'))
  blocked.delete(doc(admin, 'users', 'alice', 'progress', 'ai-foundations'))
  addDeletionCompletion(blocked, admin)
  await assertFails(blocked.commit())
  assert.equal((await getDoc(doc(admin, 'deletionCompletions', 'alice'))).exists(), false)
})

test('a certificate deletion preserves credential evidence while removing basic learner data', async () => {
  await seedPrivacyRecords()
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'certificateClaims', 'alice--ai-foundations'), { learnerUid: 'alice' })
  })
  const learner = await requestOwnDeletion()
  const admin = verifiedUser('admin-user', { admin: true })
  const batch = writeBatch(admin)
  batch.delete(doc(admin, 'users', 'alice'))
  batch.delete(doc(admin, 'users', 'alice', 'progress', 'ai-foundations'))
  addDeletionCompletion(batch, admin, 'alice', true)
  await assertSucceeds(batch.commit())
  assert.equal((await getDoc(doc(learner, 'deletionCompletions', 'alice'))).data().certificateEvidenceRetained, true)
  assert.equal((await getDoc(doc(admin, 'users', 'alice', 'submissions', 'ai-foundations-project'))).exists(), true)
  assert.equal((await getDoc(doc(admin, 'reviewResults', 'alice--ai-foundations-project'))).exists(), true)
  await assertFails(deleteDoc(doc(admin, 'certificateClaims', 'alice--ai-foundations')))
  await assertFails(deleteDoc(doc(admin, 'users', 'alice', 'submissions', 'ai-foundations-project')))
})

test('Phase 20 synthetic learner, reviewer, and administrator complete the privacy lifecycle safely', async () => {
  const uid = 'phase20-learner'
  const adminUid = 'phase20-admin'
  const learner = verifiedUser(uid)
  const reviewer = verifiedUser('phase20-reviewer', { reviewer: true })
  const admin = verifiedUser(adminUid, { admin: true })
  await seedPrivacyRecords(uid, false)
  await assertSucceeds(setDoc(doc(learner, 'deletionRequests', uid), dataDeletionRequest(uid)))

  const holdAuditId = 'phase20-retention-hold-created-0001'
  const hold = writeBatch(admin)
  hold.set(doc(admin, 'retentionHolds', uid), {
    holdId: uid, learnerUid: uid, status: 'active', reason: 'Synthetic Phase 20 exercise for the documented hold pathway.',
    createdAt: serverTimestamp(), createdBy: adminUid, updatedAt: serverTimestamp(), updatedBy: adminUid, auditId: holdAuditId,
  })
  hold.update(doc(admin, 'deletionRequests', uid), { status: 'held', updatedAt: serverTimestamp() })
  hold.set(doc(admin, 'retentionAudit', holdAuditId), {
    eventId: holdAuditId, action: 'retention.hold.created', learnerUid: uid, actorUid: adminUid,
    reason: 'Synthetic Phase 20 exercise for the documented hold pathway.', createdAt: serverTimestamp(),
  })
  await assertSucceeds(hold.commit())
  await assertFails(getDoc(doc(reviewer, 'retentionHolds', uid)))

  const releaseAuditId = 'phase20-retention-hold-released-0002'
  const release = writeBatch(admin)
  release.update(doc(admin, 'retentionHolds', uid), {
    status: 'released', reason: 'Synthetic review finished and the temporary hold is no longer required.',
    updatedAt: serverTimestamp(), updatedBy: adminUid, auditId: releaseAuditId,
  })
  release.update(doc(admin, 'deletionRequests', uid), { status: 'requested', updatedAt: serverTimestamp() })
  release.set(doc(admin, 'retentionAudit', releaseAuditId), {
    eventId: releaseAuditId, action: 'retention.hold.released', learnerUid: uid, actorUid: adminUid,
    reason: 'Synthetic review finished and the temporary hold is no longer required.', createdAt: serverTimestamp(),
  })
  await assertSucceeds(release.commit())

  const deletionAuditId = 'phase20-retention-deletion-completed-0003'
  const deletion = writeBatch(admin)
  deletion.delete(doc(admin, 'users', uid))
  deletion.delete(doc(admin, 'users', uid, 'progress', 'ai-foundations'))
  deletion.delete(doc(admin, 'users', uid, 'certificateRequests', 'ai-foundations'))
  for (const submissionId of ['ai-foundations-project', 'ai-foundations-project-revision-1']) {
    const resultId = uid + '--' + submissionId
    deletion.delete(doc(admin, 'users', uid, 'submissions', submissionId))
    deletion.delete(doc(admin, 'users', uid, 'reviewResults', resultId))
    deletion.delete(doc(admin, 'reviewResults', resultId))
    deletion.delete(doc(admin, 'reviewAssignments', resultId))
  }
  deletion.update(doc(admin, 'deletionRequests', uid), {
    status: 'completed', updatedAt: serverTimestamp(), completedAt: serverTimestamp(), certificateEvidenceRetained: false,
  })
  deletion.set(doc(admin, 'deletionCompletions', uid), deletionCompletion(uid, deletionAuditId, false))
  deletion.set(doc(admin, 'retentionAudit', deletionAuditId), {
    eventId: deletionAuditId, action: 'deletion.completed', learnerUid: uid, actorUid: adminUid,
    reason: 'Synthetic eligible learner data deleted with no certificate evidence required.', createdAt: serverTimestamp(),
  })
  await assertSucceeds(deletion.commit())

  const removalAuditId = 'phase20-authentication-removal-confirmed-0004'
  const removalRecord = {
    learnerUid: uid, method: 'firebase-console-manual', confirmedAt: serverTimestamp(), confirmedBy: adminUid, auditId: removalAuditId,
  }
  const reviewerAttempt = writeBatch(reviewer)
  reviewerAttempt.set(doc(reviewer, 'authenticationRemovals', uid), removalRecord)
  reviewerAttempt.set(doc(reviewer, 'retentionAudit', removalAuditId), {
    eventId: removalAuditId, action: 'authentication.removal.confirmed', learnerUid: uid, actorUid: 'phase20-reviewer',
    reason: 'Reviewer must not confirm Authentication account removal.', createdAt: serverTimestamp(),
  })
  await assertFails(reviewerAttempt.commit())

  const removal = writeBatch(admin)
  removal.set(doc(admin, 'authenticationRemovals', uid), removalRecord)
  removal.set(doc(admin, 'retentionAudit', removalAuditId), {
    eventId: removalAuditId, action: 'authentication.removal.confirmed', learnerUid: uid, actorUid: adminUid,
    reason: 'Administrator confirmed the exact synthetic UID was removed from Authentication.', createdAt: serverTimestamp(),
  })
  await assertSucceeds(removal.commit())
  await assertSucceeds(getDoc(doc(learner, 'authenticationRemovals', uid)))
  await assertFails(getDoc(doc(reviewer, 'authenticationRemovals', uid)))
  await assertFails(updateDoc(doc(admin, 'authenticationRemovals', uid), { method: 'changed' }))
  await assertFails(deleteDoc(doc(admin, 'authenticationRemovals', uid)))
})
