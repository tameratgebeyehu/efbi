import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

const routes = [
  { path: '/', text: 'Learn. Build.' },
  { path: '/programs', text: 'Choose what you want to learn.' },
  { path: '/programs/artificial-intelligence', text: 'Artificial Intelligence' },
  { path: '/courses', text: 'Courses built for doing.' },
  { path: '/courses/ai-foundations', text: 'AI Foundations for Ethiopia' },
  { path: '/certification', text: 'A certificate you earn.' },
  { path: '/verify', text: 'Check an EFBI certificate.', forms: 1 },
  { path: '/blog', text: 'Ideas for learning and building.' },
  { path: '/about', text: 'Built in Ethiopia, for Ethiopian learners.' },
  { path: '/contact', text: 'Let’s talk.' },
  { path: '/privacy', text: 'Your information. Your choices.' },
  { path: '/join', text: 'Enrollment is closed for now.', forms: 0 },
  { path: '/signin', text: 'Student sign-in is not available in this preview.', forms: 0 },
  { path: '/account', text: 'Student accounts are not available in this preview.', forms: 0 },
  { path: '/owner-setup', text: 'Learn. Build.', finalPath: '/' },
  { path: '/learn/ai-foundations', text: 'Student sign-in is not available in this preview.', finalPath: '/signin', forms: 0 },
  { path: '/submit/ai-foundations', text: 'Student sign-in is not available in this preview.', finalPath: '/signin', forms: 0 },
  { path: '/blog/not-a-published-article', text: 'Ideas for learning and building.', finalPath: '/blog' },
  { path: '/not-a-real-page', text: 'We couldn’t find that page.' },
]

const viewports = [
  { name: 'phone', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 1000 },
]

export function findBrowser() {
  const candidates = [
    process.env.EFBI_BROWSER_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA ?? '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean)
  const browser = candidates.find((candidate) => existsSync(candidate))
  if (!browser) throw new Error('Chrome or Edge was not found. Set EFBI_BROWSER_PATH to an installed Chromium browser.')
  return browser
}

export async function reservePort() {
  const server = net.createServer()
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve))
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  return port
}

export async function waitForServer(url, processReference, output) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (processReference.exitCode !== null) throw new Error(`Preview server stopped early.\n${output()}`)
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch { /* The server is still starting. */ }
    await pause(100)
  }
  throw new Error(`Preview server did not start.\n${output()}`)
}

export async function waitForDevtools(profileDirectory, processReference) {
  const file = path.join(profileDirectory, 'DevToolsActivePort')
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (processReference.exitCode !== null) throw new Error('The browser stopped before its test connection was ready.')
    try {
      const [port] = (await readFile(file, 'utf8')).trim().split(/\r?\n/)
      if (port) return Number(port)
    } catch { /* Chrome has not written the connection file yet. */ }
    await pause(50)
  }
  throw new Error('The browser test connection did not become ready.')
}

export async function waitForExit(processReference, milliseconds = 3000) {
  if (!processReference || processReference.exitCode !== null) return
  await Promise.race([
    new Promise((resolve) => processReference.once('exit', resolve)),
    pause(milliseconds),
  ])
}

export class DevtoolsClient {
  constructor(socket) {
    this.socket = socket
    this.nextId = 1
    this.pending = new Map()
    this.errors = []
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data))
      if (message.id) {
        const pending = this.pending.get(message.id)
        if (!pending) return
        this.pending.delete(message.id)
        if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`))
        else pending.resolve(message.result)
        return
      }
      if (message.method === 'Runtime.exceptionThrown') this.errors.push(message.params.exceptionDetails?.text ?? 'Uncaught page exception')
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') this.errors.push(message.params.args?.map((item) => item.value ?? item.description).join(' ') || 'Console error')
      if (message.method === 'Log.entryAdded' && message.params.entry?.level === 'error') this.errors.push(message.params.entry.text)
    })
  }

  static async connect(url) {
    const socket = new WebSocket(url)
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out connecting to Chrome DevTools.')), 10000)
      socket.addEventListener('open', () => { clearTimeout(timeout); resolve() }, { once: true })
      socket.addEventListener('error', () => { clearTimeout(timeout); reject(new Error('Chrome DevTools connection failed.')) }, { once: true })
    })
    return new DevtoolsClient(socket)
  }

  send(method, params = {}) {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { method, resolve, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
    return result.result.value
  }

  close() { this.socket.close() }
}

export async function openPage(devtoolsPort) {
  const response = await fetch(`http://127.0.0.1:${devtoolsPort}/json/new?about:blank`, { method: 'PUT' })
  assert.equal(response.ok, true, 'Chrome did not create a test page.')
  const target = await response.json()
  return DevtoolsClient.connect(target.webSocketDebuggerUrl)
}

export async function waitForReact(client) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const state = await client.evaluate(`({ ready: document.readyState, text: document.body?.innerText?.trim().length ?? 0, main: Boolean(document.querySelector('#main-content')) })`)
    if (state.ready === 'complete' && state.text > 80 && state.main) { await pause(150); return }
    await pause(75)
  }
  throw new Error('The React page did not finish rendering.')
}

async function inspectRoute(client, baseUrl, route, viewport) {
  await client.send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.width < 600 })
  client.errors.length = 0
  await client.send('Page.navigate', { url: `${baseUrl}${route.path}` })
  await waitForReact(client)
  const result = await client.evaluate(`(() => {
    const visible = (element) => {
      const style = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
    }
    const label = (element) => {
      if (element.getAttribute('aria-label')?.trim()) return true
      if (element.getAttribute('aria-labelledby')?.trim()) return true
      if ('labels' in element && element.labels?.length) return true
      if (element.textContent?.trim()) return true
      if (element.getAttribute('title')?.trim()) return true
      return false
    }
    const interactive = [...document.querySelectorAll('a[href], button, input:not([type="hidden"]), select, textarea')].filter(visible)
    const ids = [...document.querySelectorAll('[id]')].map((element) => element.id)
    const duplicates = [...new Set(ids.filter((id, index) => id && ids.indexOf(id) !== index))]
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible).map((heading) => Number(heading.tagName[1]))
    const skippedHeadings = headings.filter((level, index) => index > 0 && level > headings[index - 1] + 1)
    const skip = document.querySelector('.skip-link')
    skip?.focus()
    const skipTarget = skip?.getAttribute('href')
    return {
      pathname: location.pathname,
      title: document.title,
      bodyText: document.body.innerText,
      mainCount: document.querySelectorAll('main').length,
      h1Count: document.querySelectorAll('h1').length,
      formCount: document.querySelectorAll('form').length,
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
      missingImageAlt: [...document.images].filter((image) => !image.hasAttribute('alt')).map((image) => image.src),
      unlabeledInteractive: interactive.filter((element) => !label(element)).map((element) => element.outerHTML.slice(0, 120)),
      duplicates,
      skippedHeadings,
      skipLinkReady: Boolean(skip && skipTarget && document.querySelector(skipTarget) && document.activeElement === skip),
    }
  })()`)

  const context = `${viewport.name} ${route.path}`
  assert.equal(result.pathname, route.finalPath ?? route.path, `${context}: unexpected final route`)
  assert.equal(result.bodyText.includes(route.text), true, `${context}: expected page text is missing`)
  assert.equal(result.title.includes('EFBI Academy'), true, `${context}: document title is missing the EFBI name`)
  assert.equal(result.mainCount, 1, `${context}: exactly one main landmark is required`)
  assert.equal(result.h1Count, 1, `${context}: exactly one page heading is required`)
  assert.equal(result.overflow <= 1, true, `${context}: page overflows horizontally by ${result.overflow}px`)
  assert.deepEqual(result.missingImageAlt, [], `${context}: every image needs an alt attribute`)
  assert.deepEqual(result.unlabeledInteractive, [], `${context}: an interactive element has no accessible name`)
  assert.deepEqual(result.duplicates, [], `${context}: duplicate element IDs found`)
  assert.deepEqual(result.skippedHeadings, [], `${context}: heading levels are skipped`)
  assert.equal(result.skipLinkReady, true, `${context}: skip link is missing, unfocusable, or points nowhere`)
  if (route.forms !== undefined) assert.equal(result.formCount, route.forms, `${context}: unexpected form exposure`)
  assert.deepEqual(client.errors, [], `${context}: browser errors were reported`)
}

async function inspectMobileMenu(client, baseUrl) {
  await client.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true })
  await client.send('Page.navigate', { url: baseUrl })
  await waitForReact(client)
  await client.evaluate(`document.querySelector('.menu-toggle')?.click()`)
  await pause(100)
  const result = await client.evaluate(`(() => {
    const button = document.querySelector('.menu-toggle')
    return {
      exists: Boolean(button),
      expanded: button?.getAttribute('aria-expanded'),
      open: document.querySelector('#primary-navigation')?.classList.contains('is-open'),
    }
  })()`)
  assert.deepEqual(result, { exists: true, expanded: 'true', open: true }, 'phone menu must open and announce its state')
}

export async function runBrowserCheck() {
  let previewProcess
  let browserProcess
  let client
  let profileDirectory

  try {
  const port = await reservePort()
  const baseUrl = `http://127.0.0.1:${port}`
  let previewOutput = ''
  previewProcess = spawn(process.execPath, [path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js'), '--configLoader', 'native', '--mode', 'public-preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort', '--clearScreen', 'false'], { cwd: projectRoot, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
  previewProcess.stdout.on('data', (chunk) => { previewOutput += chunk })
  previewProcess.stderr.on('data', (chunk) => { previewOutput += chunk })
  await waitForServer(baseUrl, previewProcess, () => previewOutput)

  profileDirectory = await mkdtemp(path.join(os.tmpdir(), 'efbi-browser-check-'))
  browserProcess = spawn(findBrowser(), ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--metrics-recording-only', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', `--user-data-dir=${profileDirectory}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
  const devtoolsPort = await waitForDevtools(profileDirectory, browserProcess)
  client = await openPage(devtoolsPort)
  await client.send('Page.enable')
  await client.send('Runtime.enable')
  await client.send('Log.enable')

  for (const viewport of viewports) {
    for (const route of routes) await inspectRoute(client, baseUrl, route, viewport)
    console.log(`✓ ${viewport.name}: ${routes.length} routes passed`)
  }
  await inspectMobileMenu(client, baseUrl)
  console.log('✓ phone navigation opens and reports its state')
  console.log(`✓ ${routes.length * viewports.length + 1} browser checks passed`)
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
      catch (error) { console.warn(`Browser checks finished, but temporary profile cleanup was delayed: ${error.message}`) }
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await runBrowserCheck()
}
