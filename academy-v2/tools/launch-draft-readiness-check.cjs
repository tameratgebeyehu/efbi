const { createRequire } = require('node:module')
const { readFile } = require('node:fs/promises')
const { isDeepStrictEqual } = require('node:util')
const path = require('node:path')

const projectId = 'efbi-academy-dev-doha'
const approvedOwnerEmail = 'efbi.academy@gmail.com'
const packPath = path.join(__dirname, '..', 'content', 'launch-pack-v1.json')
const projectRequire = createRequire(`${__dirname}\\..\\package.json`)
const firebaseAuth = projectRequire('firebase-tools/lib/auth')
const apiv2 = projectRequire('firebase-tools/lib/apiv2')

async function getJson(url, accessToken, allowMissing = false) {
  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      'x-goog-user-project': projectId,
    },
  })
  if (allowMissing && response.status === 404) return null
  const text = await response.text()
  let parsed = {}
  try { parsed = text ? JSON.parse(text) : {} } catch { parsed = {} }
  if (!response.ok) throw new Error(parsed?.error?.message || `HTTP ${response.status}`)
  return parsed
}

function firestoreValue(value) {
  if (!value || typeof value !== 'object') return undefined
  if ('stringValue' in value) return value.stringValue
  if ('booleanValue' in value) return value.booleanValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return value.doubleValue
  if ('timestampValue' in value) return value.timestampValue
  if ('nullValue' in value) return null
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(firestoreValue)
  if ('mapValue' in value) return firestoreFields(value.mapValue.fields ?? {})
  return undefined
}

function firestoreFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, firestoreValue(value)]))
}

function parseClaims(user) {
  try { return JSON.parse(user.customAttributes || '{}') } catch { return {} }
}

async function getDocument(collection, id, accessToken) {
  const document = await getJson(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${encodeURIComponent(id)}`,
    accessToken,
    true,
  )
  return document ? firestoreFields(document.fields) : null
}

async function getOwner(accessToken) {
  let nextPageToken = ''
  do {
    const query = new URLSearchParams({ maxResults: '1000' })
    if (nextPageToken) query.set('nextPageToken', nextPageToken)
    const result = await getJson(
      `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:batchGet?${query}`,
      accessToken,
    )
    const owner = (result.users ?? []).find((user) => String(user.email ?? '').toLowerCase() === approvedOwnerEmail)
    if (owner) return owner
    nextPageToken = result.nextPageToken ?? ''
  } while (nextPageToken)
  return null
}

function expectedRecords(pack) {
  return [
    ...pack.programs.map((item) => ({ collection: 'programDrafts', id: item.programId, kind: 'Program', title: item.title, item, action: 'program.draft.created' })),
    ...pack.courses.map((item) => ({ collection: 'courseDrafts', id: item.courseId, kind: 'Course', title: item.title, item, action: 'course.draft.created' })),
    ...pack.lessons.map((item) => ({ collection: 'lessonDrafts', id: item.lessonId, kind: 'Lesson', title: item.title, item, action: 'lesson.draft.created' })),
    ...pack.articles.map((item) => ({ collection: 'blogDrafts', id: item.postId, kind: 'Article', title: item.title, item, action: 'blog.draft.created' })),
  ]
}

async function main() {
  const account = firebaseAuth.getGlobalDefaultAccount()
  if (!account?.tokens?.refresh_token) throw new Error('Firebase CLI is not signed in. Run firebase login in this trusted local terminal.')
  apiv2.setRefreshToken(account.tokens.refresh_token)
  const accessToken = await apiv2.getAccessToken()
  const pack = JSON.parse(await readFile(packPath, 'utf8'))
  const records = expectedRecords(pack)
  const owner = await getOwner(accessToken)
  const findings = []
  const inventory = []

  if (!owner) findings.push('The approved owner account is missing.')
  else {
    const claims = parseClaims(owner)
    if (owner.emailVerified !== true) findings.push('The approved owner email is not verified.')
    if (claims.admin !== true) findings.push('The approved owner does not have the administrator claim.')
  }

  for (const record of records) {
    const draft = await getDocument(record.collection, record.id, accessToken)
    if (!draft) {
      findings.push(`${record.collection}/${record.id}: draft is missing.`)
      inventory.push({ kind: record.kind, id: record.id, status: 'missing' })
      continue
    }

    const recordFindings = []
    const addFinding = (message) => {
      findings.push(`${record.collection}/${record.id}: ${message}`)
      recordFindings.push(message)
    }
    const changedFields = Object.entries(record.item)
      .filter(([key, value]) => !isDeepStrictEqual(draft[key], value))
      .map(([key]) => key)
    if (changedFields.length) addFinding(`source fields differ (${changedFields.join(', ')}).`)
    if (draft.status !== 'draft' || draft.revision !== 1 || draft.latestReleaseNumber !== 0 || draft.latestReleaseId !== '') {
      addFinding('draft lifecycle metadata is not the expected revision-one state.')
    }
    if (!draft.createdAt || !draft.updatedAt || !draft.createdBy || draft.createdBy !== draft.updatedBy) {
      addFinding('draft ownership or timestamps are incomplete.')
    }
    if (owner?.localId && draft.createdBy !== owner.localId) addFinding('draft was not created by the approved owner.')
    let audit = null
    if (!draft.lastAuditId) {
      addFinding('linked audit event is missing.')
    } else {
      audit = await getDocument('adminAudit', draft.lastAuditId, accessToken)
      const expectedEntityType = record.collection.slice(0, -1)
      if (!audit
        || audit.eventId !== draft.lastAuditId
        || audit.action !== record.action
        || audit.entityType !== expectedEntityType
        || audit.entityId !== record.id
        || audit.actorUid !== draft.createdBy
        || audit.revision !== 1
        || audit.releaseId !== ''
        || !audit.createdAt) {
        addFinding('linked audit event is missing or inconsistent.')
      }
    }
    inventory.push({
      kind: record.kind,
      id: record.id,
      title: record.title,
      status: recordFindings.length ? 'needs review' : 'verified private draft',
      lifecycle: {
        status: draft.status ?? null,
        revision: draft.revision ?? null,
        latestReleaseNumber: draft.latestReleaseNumber ?? null,
        hasLatestRelease: Boolean(draft.latestReleaseId),
        approvedOwner: Boolean(owner?.localId && draft.createdBy === owner.localId),
      },
      linkedAudit: audit ? { action: audit.action ?? null, revision: audit.revision ?? null, hasRelease: Boolean(audit.releaseId) } : null,
    })
  }

  const publicRecords = []
  for (const record of [
    ...pack.programs.map((item) => ({ collection: 'publishedPrograms', id: item.programId, kind: 'Program' })),
    ...pack.articles.map((item) => ({ collection: 'publishedPosts', id: item.postId, kind: 'Article' })),
    ...pack.courses.flatMap((item) => [
      { collection: 'activeCourses', id: item.courseId, kind: 'Active course' },
      { collection: 'publicCourseCatalog', id: item.courseId, kind: 'Public course catalog' },
    ]),
  ]) {
    const published = await getDocument(record.collection, record.id, accessToken)
    if (!published) continue
    publicRecords.push({ kind: record.kind, collection: record.collection, id: record.id, version: published.version ?? published.courseVersion ?? null })
    findings.push(`${record.collection}/${record.id}: public record exists before Phase 27J approval.`)
  }

  console.log(JSON.stringify({
    projectId,
    packId: pack.packId,
    expectedDrafts: records.length,
    exactDrafts: inventory.filter((item) => item.status === 'verified private draft').length,
    inventory,
    publicRecords,
    findings,
  }, null, 2))

  if (findings.length) {
    console.error(`LAUNCH_DRAFTS_BLOCKED: ${findings.length} finding(s) remain.`)
    process.exitCode = 1
  } else {
    console.log('LAUNCH_DRAFTS_PASS: all ten source-matched private drafts and their audit links are present; owner review and publication remain required.')
  }
}

main().catch((error) => {
  console.error(`LAUNCH_DRAFT_CHECK_FAILED: ${error.message}`)
  process.exitCode = 1
})
