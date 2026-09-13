const { createRequire } = require('node:module')

const projectId = 'efbi-academy-dev-doha'
const approvedOperators = new Map([
  ['efbi.academy@gmail.com', new Set(['admin'])],
])
const operatorRoles = new Set(['admin', 'reviewer', 'support'])
const allowedDomains = new Set([
  'localhost',
  '127.0.0.1',
  'efbi-academy-dev-doha.firebaseapp.com',
  'efbi-academy-dev-doha.web.app',
  'efbi.site',
  'www.efbi.site',
])
const requiredDevelopmentDomains = [
  'localhost',
  'efbi-academy-dev-doha.firebaseapp.com',
  'efbi-academy-dev-doha.web.app',
]
const contentCollections = [
  'publishedPrograms',
  'activeCourses',
  'publicCourseCatalog',
  'courseVersions',
  'courseReleases',
  'lessonReleases',
  'publishedPosts',
]

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
  if (!response.ok) {
    const reason = parsed?.error?.message || `HTTP ${response.status}`
    throw new Error(`Cloud readiness request failed: ${reason}`)
  }
  return parsed
}

function parseClaims(user) {
  if (!user.customAttributes) return {}
  try {
    const value = JSON.parse(user.customAttributes)
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch {
    return { __malformed: true }
  }
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

async function listAccounts(accessToken) {
  const users = []
  let nextPageToken = ''
  do {
    const query = new URLSearchParams({ maxResults: '1000' })
    if (nextPageToken) query.set('nextPageToken', nextPageToken)
    const result = await getJson(
      `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:batchGet?${query}`,
      accessToken,
    )
    users.push(...(result.users ?? []))
    nextPageToken = result.nextPageToken ?? ''
  } while (nextPageToken)
  return users
}

async function listCollection(collectionName, accessToken) {
  const documents = []
  let pageToken = ''
  do {
    const query = new URLSearchParams({ pageSize: '300' })
    if (pageToken) query.set('pageToken', pageToken)
    const result = await getJson(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}?${query}`,
      accessToken,
    )
    documents.push(...(result.documents ?? []).map((document) => ({
      id: document.name.split('/').at(-1),
      data: firestoreFields(document.fields),
    })))
    pageToken = result.nextPageToken ?? ''
  } while (pageToken)
  return documents
}

async function main() {
  const account = firebaseAuth.getGlobalDefaultAccount()
  if (!account?.tokens?.refresh_token) {
    throw new Error('Firebase CLI is not signed in. Run firebase login in this trusted local terminal.')
  }
  apiv2.setRefreshToken(account.tokens.refresh_token)
  const accessToken = await apiv2.getAccessToken()

  const [identityConfig, users, enrollmentDocument, ...collections] = await Promise.all([
    getJson(`https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`, accessToken),
    listAccounts(accessToken),
    getJson(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/publicSettings/enrollment`, accessToken, true),
    ...contentCollections.map((name) => listCollection(name, accessToken)),
  ])

  const securityFindings = []
  const contentFindings = []
  const authorizedDomains = identityConfig.authorizedDomains ?? []
  const unexpectedDomains = authorizedDomains.filter((domain) => !allowedDomains.has(domain))
  const missingDomains = requiredDevelopmentDomains.filter((domain) => !authorizedDomains.includes(domain))
  if (unexpectedDomains.length) securityFindings.push(`Remove unapproved Authentication domains: ${unexpectedDomains.join(', ')}.`)
  if (missingDomains.length) securityFindings.push(`Add required development Authentication domains: ${missingDomains.join(', ')}.`)
  if (identityConfig.signIn?.email?.enabled !== true || identityConfig.signIn?.email?.passwordRequired !== true) {
    securityFindings.push('Email/password Authentication is not configured with passwords required.')
  }

  const operatorAccounts = users.flatMap((user) => {
    const claims = parseClaims(user)
    const roles = [...operatorRoles].filter((role) => claims[role] === true)
    if (!roles.length && !claims.__malformed) return []
    return [{ email: String(user.email ?? '').toLowerCase(), verified: user.emailVerified === true, roles, malformed: claims.__malformed === true }]
  })
  for (const operator of operatorAccounts) {
    const expected = approvedOperators.get(operator.email)
    if (!expected) securityFindings.push(`Unapproved operator role account: ${operator.email || '[email missing]'}.`)
    if (!operator.verified) securityFindings.push(`Operator email is not verified: ${operator.email || '[email missing]'}.`)
    if (operator.malformed) securityFindings.push(`Operator custom claims are malformed: ${operator.email || '[email missing]'}.`)
    if (expected) {
      const unexpectedRoles = operator.roles.filter((role) => !expected.has(role))
      const absentRoles = [...expected].filter((role) => !operator.roles.includes(role))
      if (unexpectedRoles.length || absentRoles.length) securityFindings.push(`Operator role mismatch for ${operator.email}.`)
    }
  }
  for (const approvedEmail of approvedOperators.keys()) {
    if (!operatorAccounts.some((operator) => operator.email === approvedEmail)) securityFindings.push(`Approved operator role is missing: ${approvedEmail}.`)
  }

  const enrollment = enrollmentDocument ? firestoreFields(enrollmentDocument.fields) : null
  const enrollmentOpen = enrollment?.open === true
  if (enrollmentOpen) securityFindings.push('Cloud enrollment is OPEN; close it before preview or pre-launch work.')

  const inventory = Object.fromEntries(contentCollections.map((name, index) => [name, collections[index]]))
  if (!inventory.publishedPrograms.length) contentFindings.push('No published program exists.')
  if (!inventory.activeCourses.length) contentFindings.push('No active course exists.')
  if (!inventory.publishedPosts.length) contentFindings.push('No published article exists.')
  for (const active of inventory.activeCourses) {
    const courseId = String(active.data.courseId || active.id)
    const versionId = String(active.data.versionId || '')
    const version = inventory.courseVersions.find((record) => record.id === versionId)
    const catalog = inventory.publicCourseCatalog.find((record) => record.id === courseId)
    if (!version) contentFindings.push(`${courseId}: active course version is missing.`)
    if (!catalog || catalog.data.versionId !== versionId) contentFindings.push(`${courseId}: public catalog does not match the active version.`)
    const lessonIds = Array.isArray(version?.data.lessonIds) ? version.data.lessonIds : []
    for (const lessonId of lessonIds) {
      if (!inventory.lessonReleases.some((record) => record.data.courseId === courseId && record.data.lessonId === lessonId && record.data.version === version.data.courseVersion)) {
        contentFindings.push(`${courseId}: released lesson ${lessonId} is missing from its active version.`)
      }
    }
  }

  console.log(JSON.stringify({
    projectId,
    authentication: {
      authorizedDomains,
      emailPasswordEnabled: identityConfig.signIn?.email?.enabled === true,
      passwordsRequired: identityConfig.signIn?.email?.passwordRequired === true,
    },
    enrollment: enrollmentOpen ? 'OPEN' : 'closed',
    operators: operatorAccounts.map((operator) => ({ email: operator.email, verified: operator.verified, roles: operator.roles })),
    publicContentCounts: Object.fromEntries(contentCollections.map((name) => [name, inventory[name].length])),
    securityFindings,
    contentFindings,
  }, null, 2))

  if (securityFindings.length) {
    console.error(`CLOUD_SECURITY_BLOCKED: ${securityFindings.length} finding(s) require correction.`)
    process.exitCode = 1
  } else {
    console.log('CLOUD_SECURITY_PASS: domains, password sign-in, closed enrollment, and operator roles match the approved development state.')
  }
  if (contentFindings.length) {
    console.error(`CONTENT_READINESS_BLOCKED: ${contentFindings.length} finding(s) remain.`)
    process.exitCode = 1
  } else {
    console.log('CONTENT_AUTOMATION_PASS: public content references are internally complete; human approval remains required.')
  }
}

main().catch((error) => {
  console.error(`CLOUD_READINESS_FAILED: ${error.message}`)
  process.exitCode = 1
})
