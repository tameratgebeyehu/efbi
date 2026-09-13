import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const requestedUrl = process.argv[2]
const requiredHeaders = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'x-frame-options': 'DENY',
  'cross-origin-opener-policy': 'same-origin-allow-popups',
  'strict-transport-security': 'max-age=31536000',
}

const requiredPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self'",
  'https://www.youtube-nocookie.com',
  "worker-src 'self' blob:",
  'upgrade-insecure-requests',
]

function assertHeaders(headers) {
  for (const [name, expected] of Object.entries(requiredHeaders)) {
    assert.equal(headers.get(name), expected, `${name} is missing or incorrect.`)
  }
  const policy = headers.get('content-security-policy') ?? ''
  for (const directive of requiredPolicy) {
    assert.equal(policy.includes(directive), true, `Content Security Policy is missing: ${directive}`)
  }
}

if (requestedUrl) {
  const parsed = new URL(requestedUrl)
  assert.equal(['http:', 'https:'].includes(parsed.protocol), true, 'Hosting URL must use HTTP or HTTPS.')
  assert.equal(parsed.username || parsed.password, '', 'Hosting URL must not contain credentials.')
  const baseUrl = parsed.toString().replace(/\/$/, '')
  const home = await fetch(baseUrl)
  assert.equal(home.ok, true, `Hosting root returned HTTP ${home.status}.`)
  const html = await home.text()
  assertHeaders(home.headers)
  const nested = await fetch(`${baseUrl}/courses/phase-27g-route-check`)
  assert.equal(nested.ok, true, `SPA fallback returned HTTP ${nested.status}.`)
  assert.equal(await nested.text(), html, 'Firebase Hosting did not return the same application shell for a nested route.')
  console.log('✓ deployed Firebase Hosting headers and SPA fallback passed')
} else {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const config = JSON.parse(await readFile(path.join(projectRoot, 'firebase.json'), 'utf8'))
  const general = config.hosting?.headers?.find((entry) => entry.source === '**')
  assert.equal(Boolean(general), true, 'Firebase Hosting needs one general header rule.')
  const configuredHeaders = new Headers((general.headers ?? []).map((entry) => [entry.key, entry.value]))
  assertHeaders(configuredHeaders)

  const immutable = config.hosting?.headers?.find((entry) => entry.source === '**/*.@(js|css)')
  const immutableHeaders = new Headers((immutable?.headers ?? []).map((entry) => [entry.key, entry.value]))
  assert.equal(immutableHeaders.get('cache-control'), 'public, max-age=31536000, immutable', 'Built assets need immutable caching.')

  const distDirectory = path.join(projectRoot, 'dist')
  const assetDirectory = path.join(distDirectory, 'assets')
  const files = await readdir(assetDirectory)
  const builtFiles = files.filter((name) => /\.(?:js|css)$/.test(name))
  assert.equal(builtFiles.length > 0, true, 'The preview build contains no JavaScript or CSS assets.')
  const builtText = (await Promise.all(builtFiles.map((name) => readFile(path.join(assetDirectory, name), 'utf8')))).join('\n')

  let localEnvironment = ''
  try {
    localEnvironment = await readFile(path.join(projectRoot, '.env.local'), 'utf8')
  } catch { /* The isolated public-preview build does not require local Firebase configuration. */ }
  const forbiddenValues = localEnvironment.split(/\r?\n/).flatMap((line) => {
    const separator = line.indexOf('=')
    if (separator < 0) return []
    const key = line.slice(0, separator).trim()
    const value = line.slice(separator + 1).trim()
    return value && ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID'].includes(key) ? [[key, value]] : []
  })
  for (const [key, value] of forbiddenValues) {
    assert.equal(builtText.includes(value), false, `The read-only preview leaked ${key}.`)
  }

  let debugToken = ''
  try {
    const developmentEnvironment = await readFile(path.join(projectRoot, '.env.development.local'), 'utf8')
    debugToken = developmentEnvironment.split(/\r?\n/).find((line) => line.startsWith('VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN='))?.split('=').slice(1).join('=').trim() ?? ''
  } catch { /* A debug token is optional on another developer's machine. */ }
  if (debugToken) assert.equal(builtText.includes(debugToken), false, 'The read-only preview leaked the App Check debug token.')

  console.log('✓ Firebase Hosting security-header configuration is complete')
  console.log(`✓ ${builtFiles.length} preview assets are covered by immutable caching`)
  console.log('✓ the preview build contains no available local Firebase identity or App Check debug token')
}
