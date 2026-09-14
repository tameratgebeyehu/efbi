import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { deleteApp, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import {
  findBrowser,
  openPage,
  pause,
  projectRoot,
  reservePort,
  waitForDevtools,
  waitForExit,
  waitForServer,
} from './browser-check.mjs'

const projectId = 'demo-efbi'
const apiKey = 'demo-api-key'
const email = `phase27f-admin-${Date.now()}@example.test`
const password = 'Local-Admin-Test-27F!'
const learnerUid = 'phase27f-deletion-learner'
const adminRoot = path.resolve(projectRoot, '..', 'efbi-admin-studio')

const editors = [
  { nav: 'Programs', heading: 'Program workspace', label: 'Program title', key: 'efbi-admin-program-recovery-v1', prompt: 'Unsaved program text found', restored: 'locally saved program text was restored' },
  { nav: 'Blog', heading: 'Blog workspace', label: 'Article title', key: 'efbi-admin-blog-recovery-v1', prompt: 'Unsaved article found', restored: 'locally saved article was restored' },
  { nav: 'Courses', heading: 'Course workspace', label: 'Course title', key: 'efbi-admin-course-recovery-v1', prompt: 'Unsaved course text found', restored: 'locally saved course text was restored' },
  { nav: 'Lessons & videos', heading: 'Lesson workspace', label: 'Lesson title', key: 'efbi-admin-lesson-recovery-v1', prompt: 'Unsaved lesson text found', restored: 'locally saved lesson text was restored' },
]
const adminSectionLabels = ['Home', 'Programs', 'Courses', 'Lessons & videos', 'Publish course', 'Blog', 'Learner reviews', 'Certificates', 'Launch checks', 'Starter content', 'Enrollment settings', 'Safety & incidents', 'Activity history', 'Privacy & deletion']

async function waitForPage(client, predicate, description, timeout = 15000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    const state = await client.evaluate(`({ text: document.body?.innerText ?? '', ready: document.readyState })`)
    if (predicate(state)) return state
    await pause(100)
  }
  const text = await client.evaluate(`document.body?.innerText ?? ''`)
  throw new Error(`${description} did not appear.\n${text.slice(0, 1200)}`)
}

async function waitForDocumentState(reference, expectedExists, description, timeout = 15000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    if ((await reference.get()).exists === expectedExists) return
    await pause(100)
  }
  assert.fail(`${description} did not reach its expected emulator state.`)
}

async function setFieldByLabel(client, labelText, value) {
  const changed = await client.evaluate(`(() => {
    const label = [...document.querySelectorAll('label')].find((candidate) => candidate.textContent?.trim().startsWith(${JSON.stringify(labelText)}))
    const element = label?.querySelector('input, textarea')
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) return false
    const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, ${JSON.stringify(value)})
    element.dispatchEvent(new Event('input', { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  })()`)
  assert.equal(changed, true, `Editor field not found: ${labelText}`)
}

async function clickSelector(client, selector) {
  const clicked = await client.evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)})
    if (!(element instanceof HTMLElement) || ('disabled' in element && element.disabled)) return false
    element.click()
    return true
  })()`)
  assert.equal(clicked, true, `Control not found or disabled: ${selector}`)
}

async function clickButton(client, text) {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const state = await client.evaluate(`(() => {
      const button = [...document.querySelectorAll('button')].find((candidate) => candidate.textContent?.trim() === ${JSON.stringify(text)})
      if (!(button instanceof HTMLButtonElement)) return 'missing'
      if (button.disabled) return 'disabled'
      button.click()
      return 'clicked'
    })()`)
    if (state === 'clicked') return
    await pause(50)
  }
  assert.fail(`Button was missing or remained disabled: ${text}`)
}

async function openAdvancedNavigation(client) {
  if (await client.evaluate(`document.querySelector('.advanced-navigation-toggle')?.getAttribute('aria-expanded') !== 'true'`)) {
    await clickSelector(client, '.advanced-navigation-toggle')
    await pause(30)
  }
}

async function inspectStudioNavigation(client, width, height, compact) {
  await client.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 })
  await pause(120)
  const initial = await client.evaluate(`(() => {
    const visible = (element) => element && getComputedStyle(element).display !== 'none' && element.getBoundingClientRect().height > 0
    const operator = document.querySelector('.operator')
    const toggle = document.querySelector('.studio-menu-toggle')
    return {
      operatorVisible: visible(operator) && operator.getBoundingClientRect().bottom <= innerHeight + 1,
      toggleVisible: visible(toggle),
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
    }
  })()`)
  assert.equal(initial.operatorVisible, true, `${width}px: verified operator and sign-out controls must remain visible.`)
  assert.equal(initial.toggleVisible, compact, `${width}px: compact menu visibility is incorrect.`)
  assert.equal(initial.overflow <= 1, true, `${width}px: dashboard overflows horizontally by ${initial.overflow}px.`)

  if (compact) await clickSelector(client, '.studio-menu-toggle')
  await openAdvancedNavigation(client)
  const navigation = await client.evaluate(`(() => {
    const nav = document.querySelector('#studio-navigation')
    const buttons = [...(nav?.querySelectorAll('button[data-studio-section]') ?? [])]
    if (!nav || !buttons.length || getComputedStyle(nav).display === 'none') return { visible: false }
    nav.scrollTop = nav.scrollHeight
    const navRect = nav.getBoundingClientRect()
    const lastRect = buttons.at(-1).getBoundingClientRect()
    return {
      visible: true,
      buttonCount: buttons.length,
      scrollable: nav.scrollHeight <= nav.clientHeight + 1 || ['auto', 'scroll'].includes(getComputedStyle(nav).overflowY),
      lastReachable: lastRect.bottom <= navRect.bottom + 1 && lastRect.top >= navRect.top - 1,
      expanded: document.querySelector('.studio-menu-toggle')?.getAttribute('aria-expanded') ?? null,
    }
  })()`)
  assert.equal(navigation.visible, true, `${width}px: Studio navigation is not available.`)
  assert.equal(navigation.buttonCount, 14, `${width}px: all eight main and six advanced Studio sections must remain available.`)
  assert.equal(navigation.scrollable, true, `${width}px: a long Studio menu cannot scroll.`)
  assert.equal(navigation.lastReachable, true, `${width}px: the final Studio menu item cannot be reached.`)
  if (compact) {
    assert.equal(navigation.expanded, 'true', `${width}px: compact menu does not announce its open state.`)
    await client.send('Runtime.evaluate', { expression: `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))` })
    await pause(50)
    assert.equal(await client.evaluate(`document.querySelector('.studio-menu-toggle')?.getAttribute('aria-expanded')`), 'false', `${width}px: Escape does not close the compact menu.`)
  }

  for (const label of adminSectionLabels) {
    if (compact && await client.evaluate(`document.querySelector('.studio-menu-toggle')?.getAttribute('aria-expanded') !== 'true'`)) {
      await clickSelector(client, '.studio-menu-toggle')
      await pause(30)
    }
    const selected = await client.evaluate(`(() => {
      const button = [...document.querySelectorAll('#studio-navigation button[data-studio-section]')].find((candidate) => candidate.textContent?.trim() === ${JSON.stringify(label)})
      if (!(button instanceof HTMLButtonElement)) return false
      button.click()
      return true
    })()`)
    assert.equal(selected, true, `${width}px: ${label} could not be selected.`)
    await pause(120)
    const workspace = await client.evaluate(`({
      mainCount: document.querySelectorAll('main').length,
      h1Count: document.querySelectorAll('main h1').length,
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
    })`)
    assert.equal(workspace.mainCount, 1, `${width}px ${label}: exactly one main landmark is required.`)
    assert.equal(workspace.h1Count, 1, `${width}px ${label}: exactly one workspace heading is required.`)
    assert.equal(workspace.overflow <= 1, true, `${width}px ${label}: page overflows horizontally by ${workspace.overflow}px.`)
  }
}

let adminApp
let previewProcess
let browserProcess
let client
let profileDirectory

try {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
  adminApp = initializeApp({ projectId }, `phase-27f-${Date.now()}`)
  const adminAuth = getAuth(adminApp)
  const emulatorAdmin = await adminAuth.createUser({
    email,
    password,
    emailVerified: true,
    displayName: 'Phase Test Administrator',
  })
  await adminAuth.setCustomUserClaims(emulatorAdmin.uid, { admin: true })
  const deletionLearner = await adminAuth.createUser({
    uid: learnerUid,
    email: `phase27f-deletion-${Date.now()}@example.test`,
    password: 'Local-Learner-Test-27F!',
    emailVerified: true,
    displayName: 'Phase Deletion Learner',
  })
  const adminDb = getFirestore(adminApp)
  const timestamp = Timestamp.now()
  await adminDb.doc(`users/${learnerUid}`).set({
    displayName: 'Phase Deletion Learner', status: 'active', ageBand: '16-plus',
    privacyNoticeVersion: 'efbi-self-registration-privacy-v1', privacyAcceptedAt: timestamp,
    learnerSafetyVersion: 'efbi-learner-safety-v1', learnerSafetyAcceptedAt: timestamp,
    createdAt: timestamp, updatedAt: timestamp,
  })
  await adminDb.doc(`deletionRequests/${learnerUid}`).set({
    requestId: learnerUid, learnerUid, scope: 'account-and-learning-data',
    policyVersion: 'efbi-retention-v1', status: 'requested', requestedAt: timestamp,
    updatedAt: timestamp, completedAt: null, certificateEvidenceRetained: false,
  })

  const port = await reservePort()
  const baseUrl = `http://127.0.0.1:${port}`
  let previewOutput = ''
  previewProcess = spawn(process.execPath, [path.join(adminRoot, 'node_modules', 'vite', 'bin', 'vite.js'), '--configLoader', 'native', '--host', '127.0.0.1', '--port', String(port), '--strictPort', '--clearScreen', 'false'], {
    cwd: adminRoot,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      VITE_FIREBASE_API_KEY: apiKey,
      VITE_FIREBASE_AUTH_DOMAIN: `${projectId}.firebaseapp.com`,
      VITE_FIREBASE_PROJECT_ID: projectId,
      VITE_FIREBASE_APP_ID: '1:123456789:web:phase27f-admin',
      VITE_USE_FIREBASE_EMULATORS: 'true',
    },
  })
  previewProcess.stdout.on('data', (chunk) => { previewOutput += chunk })
  previewProcess.stderr.on('data', (chunk) => { previewOutput += chunk })
  await waitForServer(baseUrl, previewProcess, () => previewOutput)

  profileDirectory = await mkdtemp(path.join(os.tmpdir(), 'efbi-admin-recovery-'))
  browserProcess = spawn(findBrowser(), [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--disable-component-update', '--disable-sync',
    '--metrics-recording-only', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0',
    `--user-data-dir=${profileDirectory}`, 'about:blank',
  ], { windowsHide: true, stdio: 'ignore' })
  const devtoolsPort = await waitForDevtools(profileDirectory, browserProcess)
  client = await openPage(devtoolsPort)
  await client.send('Page.enable')
  await client.send('Runtime.enable')
  await client.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })

  await client.send('Page.navigate', { url: baseUrl })
  await waitForPage(client, (state) => state.text.includes('Sign in to the private studio.'), 'Admin sign-in')
  await setFieldByLabel(client, 'Email', email)
  await setFieldByLabel(client, 'Password', password)
  await clickButton(client, 'Sign in securely')
  await waitForPage(client, (state) => state.text.includes('What would you like to do?'), 'Verified administrator dashboard')
  assert.equal(await client.evaluate(`document.querySelectorAll('main').length`), 1, 'Admin Studio must contain exactly one main landmark.')

  await inspectStudioNavigation(client, 1152, 650, false)
  await inspectStudioNavigation(client, 800, 700, true)
  await inspectStudioNavigation(client, 375, 700, true)
  await client.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  console.log('✓ Admin Studio navigation remains reachable at zoomed-desktop, tablet, and phone widths')

  await openAdvancedNavigation(client)
  await clickButton(client, 'Starter content')
  await waitForPage(client, (state) => state.text.includes('Launch content drafts') && state.text.includes('Import 10 missing drafts'), 'Launch draft importer')
  assert.equal(await client.evaluate(`document.querySelectorAll('main').length`), 1, 'Launch draft importer must preserve one main landmark.')
  await setFieldByLabel(client, 'Type IMPORT LAUNCH DRAFTS', 'IMPORT LAUNCH DRAFTS')
  await clickSelector(client, '.launch-pack-action .confirm-check input[type="checkbox"]')
  await clickButton(client, 'Import 10 missing drafts')
  await waitForPage(client, (state) => state.text.includes('10 audited launch drafts were imported') && state.text.includes('All drafts imported'), 'Audited launch draft import', 30000)

  const importedCounts = {}
  for (const collectionName of ['programDrafts', 'courseDrafts', 'lessonDrafts', 'blogDrafts', 'adminAudit']) {
    importedCounts[collectionName] = (await adminDb.collection(collectionName).get()).size
  }
  assert.deepEqual(importedCounts, { programDrafts: 4, courseDrafts: 1, lessonDrafts: 4, blogDrafts: 1, adminAudit: 10 }, 'The launch pack did not create the exact audited draft inventory.')
  for (const collectionName of ['programDrafts', 'courseDrafts', 'lessonDrafts', 'blogDrafts']) {
    const snapshot = await adminDb.collection(collectionName).get()
    assert.equal(snapshot.docs.every((document) => document.data().status === 'draft' && document.data().revision === 1), true, `${collectionName} must contain only revision-one drafts.`)
  }
  const importedCourse = (await adminDb.doc('courseDrafts/ai-foundations').get()).data()
  assert.equal(importedCourse?.title, 'AI for Ethiopia', 'The launch course title did not match the owner-supplied series.')
  const importedLessons = (await adminDb.collection('lessonDrafts').get()).docs
    .map((document) => document.data())
    .sort((left, right) => left.order - right.order)
  assert.deepEqual(
    importedLessons.map((lesson) => [lesson.order, lesson.lessonId, lesson.videoYoutubeId]),
    [
      [1, 'welcome-to-ai-for-ethiopia', 'Bh2XmeaZsBc'],
      [2, 'what-is-ai', 'h7D-j8S1upg'],
      [3, 'ai-for-ethiopian-students', '1fqpgrk1rAg'],
      [4, 'ai-for-teachers', 'mkLStuyRPjM'],
    ],
    'The launch lessons did not preserve the verified EFBI module order and YouTube IDs.',
  )
  assert.equal(importedLessons.reduce((total, lesson) => total + lesson.durationMinutes, 0), importedCourse?.estimatedMinutes, 'The course time must equal the four current modules.')
  for (const collectionName of ['publishedPrograms', 'publishedPosts', 'courseReleases', 'lessonReleases', 'activeCourses', 'publicCourseCatalog']) {
    assert.equal((await adminDb.collection(collectionName).get()).empty, true, `Draft import must not write ${collectionName}.`)
  }
  await clickButton(client, 'Lessons & videos')
  await waitForPage(client, (state) => state.text.includes('Lessons & videos') && state.text.includes('YouTube video'), 'Lesson and video editor')
  await setFieldByLabel(client, 'YouTube video', 'https://youtu.be/Bh2XmeaZsBc?si=EFBI-test')
  await waitForPage(client, (state) => state.text.includes('Video recognized · Bh2XmeaZsBc'), 'YouTube link recognition')
  assert.equal(await client.evaluate(`document.body.innerText.includes('Paste a valid YouTube link')`), false, 'A valid full YouTube share link must not produce a validation error.')
  await client.evaluate(`localStorage.removeItem('efbi-admin-lesson-recovery-v1')`)
  console.log('✓ lesson editor accepts a full YouTube share link and extracts the safe video ID')

  await client.send('Page.reload', { ignoreCache: true })
  await waitForPage(client, (state) => state.text.includes('What would you like to do?'), 'Restored administrator session after draft import')
  await openAdvancedNavigation(client)
  await clickButton(client, 'Starter content')
  await waitForPage(client, (state) => state.text.includes('All drafts imported'), 'Idempotent launch draft state')
  console.log('✓ launch pack imported the four verified EFBI video modules as ten audited drafts without publishing or overwriting content')

  for (const [index, editor] of editors.entries()) {
    const sentinel = `Recovered ${editor.nav.toLowerCase()} text ${index + 1}`
    await clickButton(client, editor.nav)
    await waitForPage(client, (state) => state.text.includes(editor.heading), editor.heading)
    await setFieldByLabel(client, editor.label, sentinel)
    assert.equal(await client.evaluate(`Boolean(localStorage.getItem(${JSON.stringify(editor.key)})?.includes(${JSON.stringify(sentinel)}))`), true, `${editor.nav} did not save its local recovery record.`)

    await client.send('Page.reload', { ignoreCache: true })
    await waitForPage(client, (state) => state.text.includes('What would you like to do?'), 'Restored administrator session')
    await clickButton(client, editor.nav)
    await waitForPage(client, (state) => state.text.includes(editor.prompt), `${editor.nav} recovery prompt`)
    await clickButton(client, 'Restore copy')
    await waitForPage(client, (state) => state.text.toLowerCase().includes(editor.restored.toLowerCase()), `${editor.nav} recovery confirmation`)
    assert.equal(await client.evaluate(`([...document.querySelectorAll('input, textarea')].some((element) => element.value === ${JSON.stringify(sentinel)}))`), true, `${editor.nav} recovery did not restore the edited value.`)
    await client.evaluate(`localStorage.removeItem(${JSON.stringify(editor.key)})`)
    console.log(`✓ ${editor.nav.toLowerCase()} editor recovered unsaved text after reload`)
  }

  console.log('✓ all four Admin Studio editors passed isolated power-loss recovery')

  await openAdvancedNavigation(client)
  await clickButton(client, 'Privacy & deletion')
  await waitForPage(client, (state) => state.text.includes('Keep every privacy request moving') && state.text.includes(learnerUid), 'Administrator deletion workspace', 30000)
  assert.equal(await client.evaluate(`document.querySelectorAll('main').length`), 1, 'Privacy operations must contain exactly one main landmark.')
  await setFieldByLabel(client, 'Type the learner UID', learnerUid)
  await clickSelector(client, '.retention-actions form .retention-confirm input[type="checkbox"]')
  await clickButton(client, 'Delete eligible Firestore data')
  await waitForPage(client, (state) => state.text.includes('Firestore processing complete') && state.text.includes('Manual step pending'), 'Firestore deletion completion', 30000)
  await waitForDocumentState(adminDb.doc(`users/${learnerUid}`), false, 'Learner profile deletion', 30000)

  await adminAuth.deleteUser(deletionLearner.uid)
  await setFieldByLabel(client, 'Type the learner UID', learnerUid)
  await clickSelector(client, '.retention-actions form .retention-confirm input[type="checkbox"]')
  await clickButton(client, 'Record permanent confirmation')
  await waitForPage(client, (state) => state.text.includes('Request fully closed'), 'Authentication removal confirmation', 30000)
  await waitForDocumentState(adminDb.doc(`authenticationRemovals/${learnerUid}`), true, 'Authentication removal confirmation', 30000)
  console.log('✓ deletion completed through Firestore, emulator Authentication removal, and permanent confirmation')
} finally {
  if (client) {
    try { await client.send('Browser.close') } catch { /* Browser may already be closed. */ }
    client.close()
  }
  await waitForExit(browserProcess)
  if (browserProcess && browserProcess.exitCode === null) { browserProcess.kill(); await waitForExit(browserProcess, 1000) }
  if (previewProcess && previewProcess.exitCode === null) { previewProcess.kill(); await waitForExit(previewProcess, 1000) }
  if (profileDirectory) {
    try { await rm(profileDirectory, { recursive: true, force: true, maxRetries: 4, retryDelay: 150 }) }
    catch (error) { console.warn(`Recovery checks passed, but temporary profile cleanup was delayed: ${error.message}`) }
  }
  if (adminApp) await deleteApp(adminApp)
  try { await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${projectId}/accounts`, { method: 'DELETE' }) } catch { /* Emulator may already be stopping. */ }
}
