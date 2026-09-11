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
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
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
