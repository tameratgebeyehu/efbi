import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { collection, doc, getDocs, setDoc } from 'firebase/firestore'
import {
  findBrowser,
  openPage,
  pause,
  projectRoot,
  reservePort,
  waitForDevtools,
  waitForExit,
  waitForReact,
  waitForServer,
} from './browser-check.mjs'

const projectId = 'demo-efbi'
const apiKey = 'demo-api-key'
const password = 'Local-Test-Only-27E!'
const email = `phase27e-${Date.now()}@example.test`
const launchPack = JSON.parse(await readFile(new URL('../content/launch-pack-v1.json', import.meta.url), 'utf8'))
const launchCourse = launchPack.courses.find((course) => course.courseId === 'ai-foundations')
const launchLessons = launchPack.lessons
  .filter((lesson) => lesson.courseId === 'ai-foundations')
  .sort((left, right) => left.order - right.order)
const launchVersionId = 'ai-foundations--v1'

assert.ok(launchCourse, 'The launch pack must contain AI for Ethiopia.')
assert.equal(launchLessons.length, 4, 'The launch rehearsal requires the four current modules.')

async function seedLaunchCourse(db) {
  const timestamp = new Date()
  const auditId = 'audit-launch-rehearsal-ai-v1'
  const courseReleaseId = 'release-ai-foundations-v0001'
  const lessonIds = launchLessons.map((lesson) => lesson.lessonId)
  const lessonOutlines = launchLessons.map((lesson) => ({
    lessonId: lesson.lessonId,
    title: lesson.title,
    summary: lesson.summary,
    order: lesson.order,
    durationMinutes: lesson.durationMinutes,
  }))

  await Promise.all([
    setDoc(doc(db, 'courseReleases', courseReleaseId), {
      ...launchCourse,
      releaseId: courseReleaseId,
      version: 1,
      draftRevision: 2,
      publishedAt: timestamp,
      publishedBy: 'launch-rehearsal-admin',
      auditId,
    }),
    ...launchLessons.map((lesson) => {
      const releaseId = `release-${lesson.lessonId}-v0001`
      return setDoc(doc(db, 'lessonReleases', releaseId), {
        ...lesson,
        releaseId,
        version: 1,
        draftRevision: 2,
        publishedAt: timestamp,
        publishedBy: 'launch-rehearsal-admin',
        auditId,
      })
    }),
    setDoc(doc(db, 'courseVersions', launchVersionId), {
      versionId: launchVersionId,
      courseId: launchCourse.courseId,
      courseTitle: launchCourse.title,
      courseVersion: 1,
      assessmentVersion: 1,
      assessmentType: 'practice-only',
      lessonIds,
      publishedAt: timestamp,
      publishedBy: 'launch-rehearsal-admin',
      auditId,
    }),
    setDoc(doc(db, 'activeCourses', launchCourse.courseId), {
      courseId: launchCourse.courseId,
      versionId: launchVersionId,
      courseVersion: 1,
      courseTitle: launchCourse.title,
      lessonCount: launchLessons.length,
      assessmentVersion: 1,
      assessmentType: 'practice-only',
      activatedAt: timestamp,
      activatedBy: 'launch-rehearsal-admin',
      auditId,
    }),
    setDoc(doc(db, 'publicCourseCatalog', launchCourse.courseId), {
      courseId: launchCourse.courseId,
      versionId: launchVersionId,
      courseVersion: 1,
      courseTitle: launchCourse.title,
      lessonCount: launchLessons.length,
      assessmentVersion: 1,
      assessmentType: 'practice-only',
      courseDescription: launchCourse.description,
      level: launchCourse.level,
      language: launchCourse.language,
      estimatedMinutes: launchCourse.estimatedMinutes,
      lessonOutlines,
      activatedAt: timestamp,
      activatedBy: 'launch-rehearsal-admin',
      auditId,
    }),
  ])
}

async function waitForPage(client, predicate, description, timeout = 15000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    const state = await client.evaluate(`({ pathname: location.pathname, h1: document.querySelector('h1')?.textContent?.trim() ?? '', text: document.body?.innerText ?? '' })`)
    if (predicate(state)) return state
    await pause(100)
  }
  const state = await client.evaluate(`({ pathname: location.pathname, h1: document.querySelector('h1')?.textContent?.trim() ?? '', text: document.body?.innerText ?? '' })`)
  throw new Error(`${description} did not appear. Current route: ${state.pathname}\n${state.text.slice(0, 1200)}`)
}

async function setField(client, selector, value) {
  const changed = await client.evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)})
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) return false
    const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, ${JSON.stringify(value)})
    element.dispatchEvent(new Event('input', { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  })()`)
  assert.equal(changed, true, `Field not found: ${selector}`)
}

async function click(client, selector) {
  const clicked = await client.evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)})
    if (!(element instanceof HTMLElement)) return false
    element.click()
    return true
  })()`)
  assert.equal(clicked, true, `Control not found: ${selector}`)
}

async function verifyNewestEmail() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const response = await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${projectId}/oobCodes`)
    assert.equal(response.ok, true, 'Auth emulator did not expose its local email actions.')
    const body = await response.json()
    const action = body.oobCodes?.find((item) => item.email === email && item.requestType === 'VERIFY_EMAIL')
    if (action?.oobCode) {
      const confirmation = await fetch(`http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ oobCode: action.oobCode }),
      })
      assert.equal(confirmation.ok, true, `Auth emulator rejected email verification: ${await confirmation.text()}`)
      return
    }
    await pause(100)
  }
  throw new Error('The verification email action was not created in the Auth emulator.')
}

let testEnvironment
let previewProcess
let browserProcess
let client
let profileDirectory

try {
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8'),
    },
  })
  await testEnvironment.clearFirestore()
  await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${projectId}/accounts`, { method: 'DELETE' })
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, 'publicSettings', 'enrollment'), {
      open: true,
      minAge: 12,
      updatedAt: new Date(),
      updatedBy: 'phase-27e-browser-check',
    })
    await seedLaunchCourse(db)
  })

  const port = await reservePort()
  const baseUrl = `http://127.0.0.1:${port}`
  let previewOutput = ''
  previewProcess = spawn(process.execPath, [path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js'), '--configLoader', 'native', '--host', '127.0.0.1', '--port', String(port), '--strictPort', '--clearScreen', 'false'], {
    cwd: projectRoot,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      VITE_FIREBASE_API_KEY: apiKey,
      VITE_FIREBASE_AUTH_DOMAIN: `${projectId}.firebaseapp.com`,
      VITE_FIREBASE_PROJECT_ID: projectId,
      VITE_FIREBASE_APP_ID: '1:123456789:web:phase27e',
      VITE_USE_FIREBASE_EMULATORS: 'true',
      VITE_SITE_MODE: 'enrollment-open',
    },
  })
  previewProcess.stdout.on('data', (chunk) => { previewOutput += chunk })
  previewProcess.stderr.on('data', (chunk) => { previewOutput += chunk })
  await waitForServer(baseUrl, previewProcess, () => previewOutput)

  profileDirectory = await mkdtemp(path.join(os.tmpdir(), 'efbi-account-check-'))
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
  await client.send('Network.enable')
  await client.send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false })

  await client.send('Page.navigate', { url: `${baseUrl}/courses/ai-foundations` })
  await waitForReact(client)
  await waitForPage(
    client,
    (state) => state.text.includes('AI for Ethiopia') && state.text.includes('How teachers can use AI for lesson planning') && state.text.toLowerCase().includes('learning only · no certificate'),
    'Public AI for Ethiopia outline',
    30000,
  )
  const publicBoundary = await client.evaluate(`({
    lessonCount: document.querySelectorAll('.curriculum-list > li').length,
    hasPrivateBody: document.body.innerText.includes('You do not need programming experience to begin.'),
    hasAnswer: document.body.innerText.includes('Every module keeps its main learning in the written lesson'),
  })`)
  assert.deepEqual(publicBoundary, { lessonCount: 4, hasPrivateBody: false, hasAnswer: false }, 'The signed-out outline exposed private lesson content or omitted a module.')
  console.log('✓ signed-out visitors received four safe outlines without lesson bodies or answer keys')

  await client.send('Page.navigate', { url: `${baseUrl}/join` })
  await waitForReact(client)
  await click(client, 'input[value="16-plus"]')
  await waitForPage(client, (state) => state.text.includes('Before you create the account'), 'Registration form')
  await setField(client, 'input[autocomplete="name"]', 'Phase Test Learner')
  await setField(client, 'input[autocomplete="email"]', email)
  await setField(client, 'input[type="password"]', password)
  const confirmed = await client.evaluate(`(() => { const fields = [...document.querySelectorAll('input[type="password"]')]; if (fields.length !== 2) return false; const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(fields[1], ${JSON.stringify(password)}); fields[1].dispatchEvent(new Event('input', { bubbles: true })); fields[1].dispatchEvent(new Event('change', { bubbles: true })); return true })()`)
  assert.equal(confirmed, true, 'Confirmation password field was not found.')
  await client.evaluate(`document.querySelectorAll('.registration-check input').forEach((element) => element.click())`)
  await click(client, 'form.account-form button.button--primary')
  await waitForPage(client, (state) => state.pathname === '/account' && state.text.includes('Verify your email'), 'Unverified learner account')
  console.log('✓ learner registration created a private profile and verification step')

  await verifyNewestEmail()
  await client.send('Page.reload', { ignoreCache: true })
  await waitForPage(client, (state) => state.pathname === '/account' && state.text.includes('Email verified'), 'Verified learner account')
  console.log('✓ local email verification unlocked the learner account')

  await client.send('Page.navigate', { url: `${baseUrl}/learn/ai-foundations/${launchLessons[0].lessonId}` })
  await waitForPage(client, (state) => state.pathname.includes('/learn/ai-foundations') && state.text.includes('Written lesson and transcript') && state.text.includes(launchLessons[3].title), 'Protected four-module course')
  const landmarks = await client.evaluate(`document.querySelectorAll('main').length`)
  assert.equal(landmarks, 1, 'Protected lessons must contain exactly one main landmark.')
  assert.equal(await client.evaluate(`document.querySelectorAll('.lesson-sidebar li').length`), 4, 'The protected course must list exactly four current modules.')
  await client.send('Network.setBlockedURLs', { urls: ['*youtube-nocookie.com*'] })
  await click(client, '.video-gate button')
  await waitForPage(client, (state) => state.text.includes('The video could not load.'), 'Video failure fallback', 16000)
  assert.equal(await client.evaluate(`document.body.innerText.includes('Written lesson and transcript')`), true, 'Written learning must remain available when video fails.')
  console.log('✓ blocked video produced a retry option while written learning stayed available')

  await client.evaluate(`(() => {
    const originalFetch = window.fetch.bind(window)
    window.fetch = (input, init) => String(input).includes('youtube-nocookie.com/generate_204')
      ? Promise.resolve(new Response(null, { status: 204 }))
      : originalFetch(input, init)
    window.__efbiObservedVideoSources = []
    new MutationObserver(() => {
      const frame = document.querySelector('.video-frame iframe')
      if (frame && !window.__efbiObservedVideoSources.includes(frame.src)) window.__efbiObservedVideoSources.push(frame.src)
    }).observe(document.body, { childList: true, subtree: true })
  })()`)
  await client.send('Network.setBlockedURLs', { urls: ['*youtube-nocookie.com/embed/*'] })

  for (const [index, lesson] of launchLessons.entries()) {
    await waitForPage(
      client,
      (state) => state.pathname.endsWith(`/${lesson.lessonId}`) && state.h1 === lesson.title && state.text.includes('Quick knowledge check'),
      `Protected Module ${index + 1}`,
    )
    assert.equal(await client.evaluate(`Boolean(document.querySelector('.video-frame iframe'))`), false, `Module ${index + 1} loaded YouTube before learner consent.`)
    await client.evaluate(`window.__efbiObservedVideoSources = []`)
    await click(client, '.video-gate button')
    let observedVideoSource = ''
    for (let attempt = 0; attempt < 100 && !observedVideoSource; attempt += 1) {
      observedVideoSource = await client.evaluate(`window.__efbiObservedVideoSources?.[0] ?? ''`)
      if (!observedVideoSource) await pause(50)
    }
    assert.equal(observedVideoSource, `https://www.youtube-nocookie.com/embed/${lesson.videoYoutubeId}?rel=0`, `Module ${index + 1} used the wrong privacy-enhanced YouTube embed.`)

    const selectedAnswers = await client.evaluate(`(() => {
      const answers = ${JSON.stringify(launchLessons.map((item) => item.questions.map((question) => question.correctOption)))}[${index}]
      const fields = [...document.querySelectorAll('.knowledge-check fieldset')]
      if (fields.length !== answers.length) return -1
      fields.forEach((field, questionIndex) => field.querySelectorAll('input[type="radio"]')[answers[questionIndex]]?.click())
      return fields.filter((field) => field.querySelector('input[type="radio"]:checked')).length
    })()`)
    assert.equal(selectedAnswers, 3, `Module ${index + 1} did not present all three practice questions.`)
    await click(client, '.knowledge-check button[type="submit"]')
    await waitForPage(client, (state) => state.text.includes('3 of 3') && state.text.includes('You understood the key ideas.'), `Module ${index + 1} practice check`)

    await click(client, '.lesson-completion button.button--primary')
    const expectedPercent = (index + 1) * 25
    await waitForPage(client, (state) => state.text.includes(`course progress is ${expectedPercent}%`), `Module ${index + 1} saved progress`)
    if (index < launchLessons.length - 1) {
      await click(client, '.lesson-next a.button--primary')
    }
  }
  await waitForPage(client, (state) => state.text.includes('You completed all 4 lessons.') && state.text.includes('This learning-only course has no certificate.'), 'Completed learning-only course')

  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    const learners = await getDocs(collection(db, 'users'))
    assert.equal(learners.size, 1, 'The isolated rehearsal must contain exactly one synthetic learner.')
    const progress = await getDocs(collection(db, 'users', learners.docs[0].id, 'progress'))
    assert.equal(progress.size, 1, 'The completed launch rehearsal must create exactly one course-progress record.')
    assert.equal(progress.docs[0].id, 'ai-foundations', 'The progress record was saved under the wrong course.')
    const savedProgress = progress.docs[0].data()
    assert.equal(savedProgress.versionId, launchVersionId)
    assert.equal(savedProgress.percent, undefined, 'Versioned progress must not store a client-controlled percentage.')
    assert.deepEqual(savedProgress.completedLessonIds, launchLessons.map((lesson) => lesson.lessonId))
  })
  console.log('✓ one verified learner completed all four EFBI modules with exact videos, practice checks, and versioned progress')

  await client.send('Network.setBlockedURLs', { urls: [] })
  await client.send('Page.navigate', { url: `${baseUrl}/account` })
  await waitForPage(client, (state) => state.pathname === '/account' && state.text.includes('Email verified'), 'Account before sign-out')
  await click(client, '.access-actions button')
  await waitForPage(client, (state) => state.pathname === '/signin' && state.text.includes('Welcome back.'), 'Signed-out portal')
  await setField(client, 'input[autocomplete="email"]', email)
  await click(client, '.text-button')
  await waitForPage(client, (state) => state.text.includes('If an EFBI account uses that email'), 'Generic password reset response')
  await setField(client, 'input[autocomplete="current-password"]', password)
  await click(client, 'form.account-form button.button--primary')
  await waitForPage(client, (state) => state.pathname === '/account' && state.text.includes('Email verified'), 'Returning learner sign-in')
  console.log('✓ sign-out, privacy-safe reset response, and returning sign-in passed')

  await client.send('Page.navigate', { url: `${baseUrl}/privacy#deletion` })
  await waitForPage(client, (state) => state.pathname === '/privacy' && state.text.includes('Request deletion of your learning data.'), 'Learner deletion controls')
  await click(client, '.privacy-panel__action input[type="checkbox"]')
  await click(client, '.privacy-panel__action button')
  await waitForPage(client, (state) => state.text.includes('Your learning data is now restricted.'), 'Active deletion request')
  await click(client, '.privacy-panel--pending .text-button')
  await waitForPage(client, (state) => state.text.includes('Reopen deletion request'), 'Cancelled deletion request')
  await click(client, '.privacy-panel__action input[type="checkbox"]')
  await click(client, '.privacy-panel__action button')
  await waitForPage(client, (state) => state.text.includes('Your learning data is now restricted.'), 'Reopened deletion request')
  console.log('✓ learner deletion request, cancellation, and deliberate reopening passed')
  console.log('✓ isolated learner account journey passed without production data')
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
    catch (error) { console.warn(`Account checks passed, but temporary profile cleanup was delayed: ${error.message}`) }
  }
  if (testEnvironment) {
    try { await testEnvironment.clearFirestore() } catch { /* Emulator may already be stopping. */ }
    await testEnvironment.cleanup()
  }
  try { await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${projectId}/accounts`, { method: 'DELETE' }) } catch { /* Emulator may already be stopping. */ }
}
