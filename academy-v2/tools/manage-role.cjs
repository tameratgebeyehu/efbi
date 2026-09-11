const { createRequire } = require('node:module')

const projectId = 'efbi-academy-dev-doha'
const allowedRoles = new Set(['admin', 'reviewer', 'support'])
const projectRequire = createRequire(`${__dirname}\\..\\package.json`)
const firebaseAuth = projectRequire('firebase-tools/lib/auth')
const apiv2 = projectRequire('firebase-tools/lib/apiv2')

function parseArgs(values) {
  const result = { command: values[0] || '', flags: {} }
  for (let index = 1; index < values.length; index += 1) {
    const value = values[index]
    if (!value.startsWith('--')) throw new Error(`Unexpected argument: ${value}`)
    const key = value.slice(2)
    const next = values[index + 1]
    if (!next || next.startsWith('--')) throw new Error(`Missing value for --${key}`)
    result.flags[key] = next
    index += 1
  }
  return result
}

function validEmail(email) {
  return typeof email === 'string'
    && email.length >= 3
    && email.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function usage() {
  console.log(`EFBI development role manager

Read current roles:
  npm run manage:roles -- inspect --email "person@example.com"

Grant a role (the confirmation value must match exactly):
  npm run manage:roles -- set --email "person@example.com" --role admin --value true --confirm "grant:admin:person@example.com:${projectId}"

Remove a role:
  npm run manage:roles -- set --email "person@example.com" --role admin --value false --confirm "remove:admin:person@example.com:${projectId}"

This tool is intentionally limited to ${projectId}.`)
}

async function request(url, accessToken, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
      'x-goog-user-project': projectId,
    },
    body: JSON.stringify(body),
  })
  const text = await response.text()
  let parsed = {}
  try { parsed = text ? JSON.parse(text) : {} } catch { parsed = {} }
  if (!response.ok) {
    const reason = parsed?.error?.message || `HTTP ${response.status}`
    throw new Error(`Firebase role request failed: ${reason}`)
  }
  return parsed
}

function parseClaims(user) {
  if (!user.customAttributes) return {}
  try {
    const claims = JSON.parse(user.customAttributes)
    return claims && typeof claims === 'object' && !Array.isArray(claims) ? claims : {}
  } catch {
    throw new Error('The account has malformed custom claims; stop and inspect it manually.')
  }
}

async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2))
  if (!['inspect', 'set'].includes(command)) {
    usage()
    process.exitCode = command ? 1 : 0
    return
  }

  const email = String(flags.email || '').trim().toLowerCase()
  if (!validEmail(email)) throw new Error('Provide one valid --email value.')

  const account = firebaseAuth.getGlobalDefaultAccount()
  if (!account?.tokens?.refresh_token) {
    throw new Error('Firebase CLI is not signed in. Run firebase login in this trusted local terminal.')
  }
  apiv2.setRefreshToken(account.tokens.refresh_token)
  const accessToken = await apiv2.getAccessToken()

  const lookup = await request(
    `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:lookup`,
    accessToken,
    { email: [email] },
  )
  const user = lookup.users?.[0]
  if (!user) throw new Error('No Firebase Authentication account was found for that email.')
  const claims = parseClaims(user)
  const roleSummary = Object.fromEntries([...allowedRoles].map((role) => [role, claims[role] === true]))

  if (command === 'inspect') {
    console.log(JSON.stringify({
      projectId,
      email,
      uid: user.localId,
      emailVerified: user.emailVerified === true,
      roles: roleSummary,
    }, null, 2))
    return
  }

  const role = String(flags.role || '').trim().toLowerCase()
  if (!allowedRoles.has(role)) throw new Error(`--role must be one of: ${[...allowedRoles].join(', ')}`)
  if (!['true', 'false'].includes(flags.value)) throw new Error('--value must be true or false.')
  const enabled = flags.value === 'true'
  if (enabled && user.emailVerified !== true) throw new Error('Refusing to grant a role to an unverified email account.')

  const action = enabled ? 'grant' : 'remove'
  const expectedConfirmation = `${action}:${role}:${email}:${projectId}`
  if (flags.confirm !== expectedConfirmation) {
    throw new Error(`Role change not confirmed. Pass --confirm "${expectedConfirmation}" exactly.`)
  }

  const nextClaims = { ...claims }
  if (enabled) nextClaims[role] = true
  else delete nextClaims[role]

  await request(
    `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`,
    accessToken,
    { localId: user.localId, customAttributes: JSON.stringify(nextClaims) },
  )

  console.log(`ROLE_CHANGE_COMPLETE: ${role} ${enabled ? 'granted to' : 'removed from'} ${email} in ${projectId}.`)
  console.log('The user must sign in again or refresh their Firebase ID token before the change appears.')
}

main().catch((error) => {
  console.error(`ROLE_CHANGE_FAILED: ${error.message}`)
  process.exitCode = 1
})
