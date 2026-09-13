import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const academyRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repositoryRoot = path.dirname(academyRoot)
const sourceRoots = [
  path.join(academyRoot, 'src'),
  path.join(repositoryRoot, 'efbi-admin-studio', 'src'),
]

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const location = path.join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(location)
    return /\.(?:ts|tsx)$/.test(entry.name) ? [location] : []
  }))
  return nested.flat()
}

const files = (await Promise.all(sourceRoots.map(sourceFiles))).flat()
const records = await Promise.all(files.map(async (file) => ({
  file,
  text: await readFile(file, 'utf8'),
})))

const forbidden = [
  ['raw HTML injection', /dangerouslySetInnerHTML|\.innerHTML\s*=|\.outerHTML\s*=/],
  ['dynamic code execution', /\beval\s*\(|new Function\s*\(|document\.write\s*\(/],
  ['non-local insecure HTTP URL', /http:\/\/(?!127\.0\.0\.1(?::\d+)?(?:\/|['"`])|localhost(?::\d+)?(?:\/|['"`]))/],
]

for (const [label, pattern] of forbidden) {
  const matches = records.filter((record) => pattern.test(record.text)).map((record) => path.relative(repositoryRoot, record.file))
  assert.deepEqual(matches, [], `${label} found in: ${matches.join(', ')}`)
}

for (const record of records) {
  const links = record.text.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/g)
  for (const match of links) {
    assert.equal(/rel=["'][^"']*noopener[^"']*["']/.test(match[0]), true, `New-tab link lacks noopener in ${path.relative(repositoryRoot, record.file)}`)
  }
}

const nestedMainFiles = [
  'CertificateManager.tsx',
  'ReviewManager.tsx',
  'RetentionManager.tsx',
  'OwnerPreview.tsx',
]
for (const name of nestedMainFiles) {
  const record = records.find((item) => path.basename(item.file) === name)
  assert.equal(Boolean(record), true, `Expected Admin Studio source file is missing: ${name}`)
  assert.equal(/<main\b/.test(record.text), false, `Nested main landmark found in ${name}`)
}

const storageFiles = records.filter((record) => /(?:local|session)Storage\./.test(record.text))
for (const record of storageFiles) {
  assert.equal(/password|credential|idToken|refreshToken|accessToken/i.test(record.text), false, `Sensitive account value may enter browser storage in ${path.relative(repositoryRoot, record.file)}`)
}

console.log(`✓ ${records.length} TypeScript source files passed unsafe-execution and insecure-URL checks`)
console.log('✓ every source new-tab link includes noopener')
console.log('✓ Admin Studio panels preserve one page-level main landmark')
console.log('✓ browser storage code contains no account-secret fields')
