const { createHash } = require('node:crypto')
const { createRequire } = require('node:module')
const { readFile } = require('node:fs/promises')
const path = require('node:path')

const projectId = 'efbi-academy-dev-doha'
const localRulesPath = path.join(__dirname, '..', 'firestore.rules')
const projectRequire = createRequire(`${__dirname}\\..\\package.json`)
const firebaseAuth = projectRequire('firebase-tools/lib/auth')
const apiv2 = projectRequire('firebase-tools/lib/apiv2')

async function getJson(url, accessToken) {
  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      'x-goog-user-project': projectId,
    },
  })
  const text = await response.text()
  let parsed = {}
  try { parsed = text ? JSON.parse(text) : {} } catch { parsed = {} }
  if (!response.ok) throw new Error(parsed?.error?.message || `HTTP ${response.status}`)
  return parsed
}

function normalize(value) {
  return value.replace(/\r\n/g, '\n').trimEnd()
}

function fingerprint(value) {
  return createHash('sha256').update(normalize(value)).digest('hex').slice(0, 16)
}

async function main() {
  const account = firebaseAuth.getGlobalDefaultAccount()
  if (!account?.tokens?.refresh_token) throw new Error('Firebase CLI is not signed in. Run firebase login in this trusted local terminal.')
  apiv2.setRefreshToken(account.tokens.refresh_token)
  const accessToken = await apiv2.getAccessToken()

  const release = await getJson(
    `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`,
    accessToken,
  )
  if (!release.rulesetName) throw new Error('The active Cloud Firestore release does not reference a ruleset.')
  const ruleset = await getJson(`https://firebaserules.googleapis.com/v1/${release.rulesetName}`, accessToken)
  const files = ruleset.source?.files ?? []
  const deployedRules = files.find((file) => file.name === 'firestore.rules') ?? files[0]
  if (!deployedRules?.content) throw new Error('The active ruleset does not contain a readable source file.')

  const localRules = await readFile(localRulesPath, 'utf8')
  const localMatch = normalize(localRules) === normalize(deployedRules.content)
  console.log(JSON.stringify({
    projectId,
    release: release.name,
    ruleset: release.rulesetName,
    deployedAt: release.updateTime || release.createTime || null,
    deployedFileNames: files.map((file) => file.name),
    localFingerprint: fingerprint(localRules),
    deployedFingerprint: fingerprint(deployedRules.content),
    localMatch,
  }, null, 2))

  if (!localMatch) {
    console.error('DEPLOYED_RULES_BLOCKED: the development project is not running the tested repository rules.')
    process.exitCode = 1
  } else {
    console.log('DEPLOYED_RULES_PASS: the development project matches the tested repository rules exactly.')
  }
}

main().catch((error) => {
  console.error(`DEPLOYED_RULES_CHECK_FAILED: ${error.message}`)
  process.exitCode = 1
})
