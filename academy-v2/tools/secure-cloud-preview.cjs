const { createRequire } = require('node:module')

const projectId = 'efbi-academy-dev-doha'
const ownerEmail = 'efbi.academy@gmail.com'
const expectedConfirmation = `secure-preview:${projectId}`
const projectRequire = createRequire(`${__dirname}\\..\\package.json`)
const firebaseAuth = projectRequire('firebase-tools/lib/auth')
const apiv2 = projectRequire('firebase-tools/lib/apiv2')

async function request(url, accessToken, { method = 'GET', body, allowMissing = false } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
      'x-goog-user-project': projectId,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (allowMissing && response.status === 404) return null
  const text = await response.text()
  let parsed = {}
  try { parsed = text ? JSON.parse(text) : {} } catch { parsed = {} }
  if (!response.ok) {
    const reason = parsed?.error?.message || `HTTP ${response.status}`
    throw new Error(`Preview-safety request failed: ${reason}`)
  }
  return parsed
}

function claimsFor(user) {
  try {
    const claims = JSON.parse(user.customAttributes || '{}')
    return claims && typeof claims === 'object' && !Array.isArray(claims) ? claims : {}
  } catch {
    throw new Error('The owner account has malformed custom claims.')
  }
}

async function main() {
  const confirmIndex = process.argv.indexOf('--confirm')
  const confirmation = confirmIndex >= 0 ? process.argv[confirmIndex + 1] : ''
  if (confirmation !== expectedConfirmation) {
    throw new Error(`Refusing to change cloud safety settings. Pass --confirm "${expectedConfirmation}" exactly.`)
  }

  const account = firebaseAuth.getGlobalDefaultAccount()
  if (!account?.tokens?.refresh_token) {
    throw new Error('Firebase CLI is not signed in. Run firebase login in this trusted local terminal.')
  }
  apiv2.setRefreshToken(account.tokens.refresh_token)
  const accessToken = await apiv2.getAccessToken()

  const lookup = await request(
    `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:lookup`,
    accessToken,
    { method: 'POST', body: { email: [ownerEmail] } },
  )
  const owner = lookup.users?.[0]
  const claims = owner ? claimsFor(owner) : {}
  if (!owner || owner.emailVerified !== true || claims.admin !== true) {
    throw new Error('The approved verified owner account does not currently have the administrator claim.')
  }

  const identityUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`
  const identityConfig = await request(identityUrl, accessToken)
  const currentDomains = identityConfig.authorizedDomains ?? []
  if (!currentDomains.includes('localhost')) {
    await request(`${identityUrl}?updateMask=authorizedDomains`, accessToken, {
      method: 'PATCH',
      body: { authorizedDomains: [...currentDomains, 'localhost'] },
    })
    console.log('AUTHORIZED_DOMAIN_ADDED: localhost')
  } else {
    console.log('AUTHORIZED_DOMAIN_UNCHANGED: localhost is already approved')
  }

  const documentUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/publicSettings/enrollment`
  const currentEnrollment = await request(documentUrl, accessToken, { allowMissing: true })
  const currentlyOpen = currentEnrollment?.fields?.open?.booleanValue === true
  const fields = {
    open: { booleanValue: false },
    minAge: { integerValue: '12' },
    updatedAt: { timestampValue: new Date().toISOString() },
    updatedBy: { stringValue: owner.localId },
  }
  await request(documentUrl, accessToken, {
    method: 'PATCH',
    body: { name: documentUrl.replace('https://firestore.googleapis.com/v1/', ''), fields },
  })
  console.log(currentlyOpen
    ? 'ENROLLMENT_CLOSED: the development server boundary now denies new learner profiles'
    : 'ENROLLMENT_UNCHANGED: the development server boundary remains closed')
  console.log('PREVIEW_SAFETY_COMPLETE: no role, content, App Check, Hosting, or deployment setting was changed')
}

main().catch((error) => {
  console.error(`PREVIEW_SAFETY_FAILED: ${error.message}`)
  process.exitCode = 1
})
